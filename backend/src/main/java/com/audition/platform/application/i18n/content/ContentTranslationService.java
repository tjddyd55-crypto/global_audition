package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.Bcp47Tags;
import com.audition.platform.application.i18n.LocaleRegistry;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * 조회는 저장된 번역 또는 원문만 반환한다. 공급자를 호출하지 않고, 없는 로케일만 큐에 넣는다.
 */
@Service
public class ContentTranslationService {

    private static final TypeReference<Map<String, String>> FIELDS = new TypeReference<>() {
    };

    private final List<ContentTranslationSource> sources;
    private final ContentTranslationStore store;
    private final ContentTranslationQuota quota;
    private final LocaleRegistry locales;
    private final TranslationQueueProperties properties;
    private final ObjectMapper objectMapper;

    public ContentTranslationService(
            List<ContentTranslationSource> sources,
            ContentTranslationStore store,
            ContentTranslationQuota quota,
            LocaleRegistry locales,
            TranslationQueueProperties properties,
            ObjectMapper objectMapper) {
        this.sources = sources;
        this.store = store;
        this.quota = quota;
        this.locales = locales;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public ContentTranslationView read(String type, UUID id, String rawLocale, boolean viewOriginal, UUID viewer) {
        Loaded loaded = requireReadable(type, id, viewer);
        String requested = canonicalOrDefault(rawLocale);
        if (viewOriginal || sameLocale(loaded.snapshot(), requested)) {
            return original(loaded.snapshot(), requested, false, null, null);
        }
        if (!locales.providerSupports(requested)) {
            return original(loaded.snapshot(), requested, true, null, ContentTypes.LOCALE_UNSUPPORTED);
        }
        if (!locales.activeTarget(requested)) {
            return original(loaded.snapshot(), requested, true, null, ContentTypes.TARGET_INACTIVE);
        }
        String hash = ContentSourceFingerprint.hash(loaded.snapshot().sourceLocale(), loaded.snapshot().fields());
        store.markStaleWhereHashDiffers(type, id, hash);
        StoredTranslation row = store.findTranslation(type, id, requested).orElse(null);
        boolean fresh = row != null
                && AuditionTranslation.STATUS_COMPLETED.equals(row.status())
                && hash.equals(row.sourceHash());
        if (fresh) {
            return translated(loaded.snapshot(), requested, row, null);
        }
        UUID jobId = null;
        if (!protectedRow(row)) {
            jobId = enqueue(loaded, requested, hash, false, false, viewer).orElse(null);
        }
        if (row != null && AuditionTranslation.STATUS_COMPLETED.equals(row.status())) {
            return translated(loaded.snapshot(), requested, row, jobId);
        }
        String error = errorFrom(type, id, requested, jobId);
        return original(loaded.snapshot(), requested, true, jobId, error);
    }

    public ContentTranslationView retry(String type, UUID id, String rawLocale, boolean force, UUID viewer) {
        Loaded loaded = requireReadable(type, id, viewer);
        if (force && !loaded.source().canWrite(loaded.snapshot(), viewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TRANSLATION_FORBIDDEN");
        }
        String requested = requireActive(rawLocale);
        if (sameLocale(loaded.snapshot(), requested)) {
            return original(loaded.snapshot(), requested, false, null, null);
        }
        String hash = ContentSourceFingerprint.hash(loaded.snapshot().sourceLocale(), loaded.snapshot().fields());
        Optional<UUID> jobId = enqueue(loaded, requested, hash, true, force, viewer);
        StoredTranslation row = store.findTranslation(type, id, requested).orElse(null);
        if (row != null && AuditionTranslation.STATUS_COMPLETED.equals(row.status()) && hash.equals(row.sourceHash())) {
            return translated(loaded.snapshot(), requested, row, jobId.orElse(null));
        }
        return original(loaded.snapshot(), requested, true, jobId.orElse(null), errorFrom(type, id, requested, jobId.orElse(null)));
    }

    public ContentTranslationView saveManual(String type, UUID id, String rawLocale, Map<String, String> fields, UUID viewer) {
        Loaded loaded = requireReadable(type, id, viewer);
        if (!loaded.source().canWrite(loaded.snapshot(), viewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TRANSLATION_FORBIDDEN");
        }
        String requested = requireSupported(rawLocale);
        Map<String, String> body = new LinkedHashMap<>();
        loaded.snapshot().fields().keySet().forEach(key -> body.put(key, fields == null ? "" : fields.getOrDefault(key, "")));
        String hash = ContentSourceFingerprint.hash(loaded.snapshot().sourceLocale(), loaded.snapshot().fields());
        StoredTranslation existing = store.findTranslation(type, id, requested).orElse(null);
        long revision = existing == null || existing.sourceRevision() == null ? 1L : existing.sourceRevision();
        if (existing != null && existing.sourceHash() != null && !existing.sourceHash().equals(hash)) {
            revision = existing.sourceRevision() == null ? 2L : existing.sourceRevision() + 1;
        }
        StoredTranslation row = new StoredTranslation(
                type, id, requested, loaded.snapshot().sourceLocale(), hash, revision, writeJson(body),
                AuditionTranslation.STATUS_COMPLETED, false, AuditionTranslation.PROVIDER_MANUAL,
                AuditionTranslation.ORIGIN_MANUAL, true, existing == null ? 0L : existing.rowVersion(),
                null, null);
        if (existing == null) {
            store.insertTranslation(row);
        } else if (!store.compareAndSet(row, existing.rowVersion())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ContentTypes.CONCURRENT_EDIT);
        }
        return translated(loaded.snapshot(), requested, store.findTranslation(type, id, requested).orElse(row), null);
    }

    /**
     * 게시처럼 화면 조회가 아닌 시점에 활성 대상만 큐에 넣는다. 영어가 설정 순서상 먼저다.
     * 원문과 같은 로케일은 넣지 않는다. 공급자는 호출하지 않는다.
     */
    public void requestActiveTargets(String type, UUID id, UUID actor) {
        ContentTranslationSource source = sources.stream()
                .filter(item -> item.type().equals(type))
                .findFirst()
                .orElse(null);
        if (source == null) {
            return;
        }
        ContentSnapshot snapshot = source.load(id).orElse(null);
        if (snapshot == null) {
            return;
        }
        if (!source.canRead(snapshot, actor) && !source.canWrite(snapshot, actor)) {
            return;
        }
        if (!hasProse(snapshot)) {
            return;
        }
        String hash = ContentSourceFingerprint.hash(snapshot.sourceLocale(), snapshot.fields());
        store.markStaleWhereHashDiffers(type, id, hash);
        Loaded loaded = new Loaded(source, snapshot);
        for (String target : locales.activeTargets()) {
            if (sameLocale(snapshot, target) || !locales.providerSupports(target)) {
                continue;
            }
            enqueue(loaded, target, hash, false, false, actor);
        }
    }

    private Optional<UUID> enqueue(Loaded loaded, String locale, String hash, boolean explicit, boolean force, UUID viewer) {
        ContentSnapshot snapshot = loaded.snapshot();
        StoredTranslation current = store.findTranslation(snapshot.contentType(), snapshot.contentId(), locale).orElse(null);
        if (protectedRow(current) && !force) {
            return store.findLatestJob(snapshot.contentType(), snapshot.contentId(), locale).map(StoredJob::id);
        }
        Optional<StoredJob> active = store.findActiveJob(snapshot.contentType(), snapshot.contentId(), locale);
        if (active.isPresent()) {
            return Optional.of(active.get().id());
        }
        StoredJob latest = store.findLatestJob(snapshot.contentType(), snapshot.contentId(), locale).orElse(null);
        if (latest != null && hash.equals(latest.sourceHash()) && ContentTypes.terminal(latest.status())) {
            if (!explicit) {
                return Optional.of(latest.id());
            }
            if (latest.attemptCount() >= latest.maxAttempts() && !force) {
                throw new ContentTranslationLimitException(ContentTypes.RETRY_EXHAUSTED, HttpStatus.CONFLICT);
            }
        }
        try {
            quota.check(viewer, snapshot.agencyUserId());
        } catch (ContentTranslationLimitException ex) {
            if (explicit) {
                throw ex;
            }
            return Optional.empty();
        }
        NewJob job = new NewJob(
                UUID.randomUUID(), snapshot.contentType(), snapshot.contentId(), locale, hash,
                viewer, snapshot.agencyUserId(), properties.getMaxAttempts(), force);
        Optional<UUID> inserted = store.insertPendingJob(job);
        if (inserted.isPresent()) {
            return inserted;
        }
        return store.findActiveJob(snapshot.contentType(), snapshot.contentId(), locale).map(StoredJob::id);
    }

    private Loaded requireReadable(String type, UUID id, UUID viewer) {
        ContentTranslationSource source = sources.stream()
                .filter(item -> item.type().equals(type))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ContentTypes.CONTENT_NOT_FOUND));
        ContentSnapshot snapshot = source.load(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, ContentTypes.CONTENT_NOT_FOUND));
        if (!source.canRead(snapshot, viewer)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ContentTypes.CONTENT_NOT_FOUND);
        }
        return new Loaded(source, snapshot);
    }

    private String requireSupported(String rawLocale) {
        String tag = Bcp47Tags.canonicalize(rawLocale);
        if (tag.isEmpty() || !locales.providerSupports(tag)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ContentTypes.LOCALE_UNSUPPORTED);
        }
        return tag;
    }

    private String requireActive(String rawLocale) {
        String tag = requireSupported(rawLocale);
        if (!locales.activeTarget(tag)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ContentTypes.TARGET_INACTIVE);
        }
        return tag;
    }

    private static boolean hasProse(ContentSnapshot snapshot) {
        return snapshot.fields().values().stream().anyMatch(value -> value != null && !value.isBlank());
    }

    private String canonicalOrDefault(String rawLocale) {
        String tag = Bcp47Tags.canonicalize(rawLocale);
        return tag.isEmpty() ? locales.viewingDefault() : tag;
    }

    private static boolean sameLocale(ContentSnapshot snapshot, String requested) {
        return snapshot.sourceLocale() != null && snapshot.sourceLocale().equals(requested);
    }

    private static boolean protectedRow(StoredTranslation row) {
        return row != null && (row.manuallyEdited() || AuditionTranslation.ORIGIN_MANUAL.equals(row.origin()));
    }

    private String errorFrom(String type, UUID id, String locale, UUID jobId) {
        if (jobId != null) {
            String code = store.findLatestJob(type, id, locale).map(StoredJob::errorCode).orElse(null);
            if (code != null) {
                return code;
            }
        }
        return store.latestAttempt(type, id, locale).map(attempt -> attempt.errorCode()).orElse(null);
    }

    private ContentTranslationView original(
            ContentSnapshot snapshot, String requested, boolean fallback, UUID jobId, String errorCode) {
        return new ContentTranslationView(
                snapshot.contentType(), snapshot.contentId(), snapshot.sourceLocale(), requested,
                snapshot.sourceLocale(),
                fallback, true, false, null, null, errorCode, snapshot.fields(), jobId);
    }

    private ContentTranslationView translated(
            ContentSnapshot snapshot, String requested, StoredTranslation row, UUID jobId) {
        boolean stale = row.stale() || (row.sourceHash() != null
                && !row.sourceHash().equals(ContentSourceFingerprint.hash(snapshot.sourceLocale(), snapshot.fields())));
        return new ContentTranslationView(
                snapshot.contentType(), snapshot.contentId(), snapshot.sourceLocale(), requested, requested,
                false, false, stale, row.status(), row.origin(), row.errorCode(), readJson(row.bodyJson()), jobId);
    }

    private String writeJson(Map<String, String> fields) {
        try {
            return objectMapper.writeValueAsString(fields);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MALFORMED_JSON");
        }
    }

    private Map<String, String> readJson(String json) {
        try {
            if (json == null || json.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(json, FIELDS);
        } catch (Exception e) {
            return Map.of();
        }
    }

    private record Loaded(ContentTranslationSource source, ContentSnapshot snapshot) {
    }
}
