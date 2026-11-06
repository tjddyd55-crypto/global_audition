package com.audition.platform.application.i18n;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.AuditionTextSnapshot;
import com.audition.platform.api.dto.AuditionTranslationUpsertRequest;
import com.audition.platform.api.dto.AuditionTranslationView;
import com.audition.platform.api.dto.UpdateAuditionRequest;
import com.audition.platform.application.audition.AuditionSeriesPresentation;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.audition.AuditionTranslationAttemptRepository;
import com.audition.platform.domain.audition.AuditionTranslationId;
import com.audition.platform.domain.audition.AuditionTranslationRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.audition.platform.application.i18n.content.ContentTranslationStore;
import com.audition.platform.application.i18n.content.ContentTypes;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Map;
import java.util.List;
import java.util.UUID;

@Service
public class AuditionLocalizationService {

    private final AuditionTranslationRepository translationRepository;
    private final AuditionRepository auditionRepository;
    private final ContentLocaleResolver contentLocaleResolver;
    private final AuditionTranslationAttemptRepository attemptRepository;

    public AuditionLocalizationService(
            AuditionTranslationRepository translationRepository,
            AuditionRepository auditionRepository,
            ContentLocaleResolver contentLocaleResolver,
            AuditionTranslationAttemptRepository attemptRepository) {
        this.translationRepository = translationRepository;
        this.auditionRepository = auditionRepository;
        this.contentLocaleResolver = contentLocaleResolver;
        this.attemptRepository = attemptRepository;
    }

    private ContentTranslationStore contentStore;
    private ObjectMapper objectMapper;

    /** 콘텐츠 번역 저장소(AUDITION_POSTING). 공고 번역 행이 없을 때 목록·카드도 같은 번역을 쓰게 한다. */
    @Autowired(required = false)
    public void setContentTranslationStore(ContentTranslationStore contentStore, ObjectMapper objectMapper) {
        this.contentStore = contentStore;
        this.objectMapper = objectMapper;
    }

    public void apply(Audition audition, AuditionResponse response) {
        apply(audition, response, contentLocaleResolver.resolve());
    }

    public void apply(Audition audition, AuditionResponse response, String requestedRaw) {
        applyOverlay(audition, response, requestedRaw, false);
    }

    public void applyPreview(Audition audition, AuditionResponse response, String requestedRaw) {
        applyOverlay(audition, response, requestedRaw, true);
        response.setPreview(true);
    }

    /**
     * 지원서 목록의 공고 제목. 선택 로케일에 완료된 번역이 있으면 그 제목, 없으면 원문.
     * 공개 목록과 같은 오버레이이며 공급자를 호출하지 않는다.
     */
    public String titleForViewer(Audition audition, String requestedRaw) {
        String original = audition.getTitle() != null ? audition.getTitle() : "";
        AuditionResponse response = new AuditionResponse();
        response.setTitle(original);
        apply(audition, response, requestedRaw);
        String shown = response.getTitle();
        if (shown == null || shown.isBlank()) {
            return original;
        }
        return shown;
    }

    /** 소유자 편집 화면. 표시 필드를 번역으로 덮지 않는다. */
    public void attachOriginalOnly(Audition audition, AuditionResponse response) {
        String original = authoringLocale(audition);
        response.setDefaultLocale(original);
        response.setContentLocale(original);
        response.setContentLocaleFallback(false);
        response.setShowingOriginal(true);
        response.setPreview(false);
        rememberOriginal(response);
        response.setTranslationContent(null);
        finishLabels(audition, response);
    }

    /**
     * 번역 오버레이와 같은 값은 원문에 쓰지 않는다.
     * @return 원문 필드가 실제로 바뀌었으면 true
     */
    @Transactional
    public boolean writeOriginal(Audition audition, UpdateAuditionRequest request) {
        return AuditionOriginalWriteGuard.apply(audition, request, overlaySnapshots(audition.getId()));
    }

    /**
     * 번역 행마다 제목·설명·본문 해시(없으면 기존 source_hash)를 현재 원문과 비교한다.
     * 같으면 stale 을 해제하고 번역 본문은 그대로 둔다. 다를 때만 stale 이다.
     * 기준 해시가 아직 없는 행은 원문 해시를 처음 잡을 때만 stale 로 표시한다.
     */
    @Transactional
    public void onSourceWritten(Audition audition, boolean translatableFieldsPresent) {
        String hash = AuditionSourceFingerprint.hash(audition);
        String fields = SourceFieldHashes.ofAudition(audition);
        String previous = audition.getContentSourceHash();
        boolean firstBaseline = previous == null;
        if (firstBaseline) {
            audition.setContentSourceHash(hash);
            if (audition.getContentRevision() < 1) {
                audition.setContentRevision(1);
            }
        } else if (!hash.equals(previous)) {
            audition.setContentSourceHash(hash);
            audition.setContentRevision(audition.getContentRevision() + 1);
        }
        reconcileRows(audition.getId(), fields, hash, firstBaseline && translatableFieldsPresent);
    }

    private void applyOverlay(Audition audition, AuditionResponse response, String requestedRaw, boolean preview) {
        String original = authoringLocale(audition);
        String requested = viewingLocale(requestedRaw, original);
        response.setDefaultLocale(original);
        response.setContentLocale(original);
        response.setContentLocaleFallback(false);
        response.setShowingOriginal(false);
        response.setPreview(preview);
        response.setApplyBlockedCode(response.getApplyBlockedMessage() == null
                ? null
                : AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED_CODE);
        rememberOriginal(response);

        if (requested.equals(original)) {
            response.setShowingOriginal(true);
            response.setTranslationContent(null);
            finishLabels(audition, response);
            return;
        }

        AuditionTranslation row = translationRepository
                .findByAuditionIdAndLocale(audition.getId(), requested)
                .orElse(null);
        if (canOverlay(row, preview)) {
            overlay(response, row);
            response.setContentLocale(requested);
            describeRow(audition, response, row);
        } else if (!preview && overlayFromContentStore(audition, response, requested)) {
            response.setContentLocale(requested);
        } else {
            response.setContentLocaleFallback(true);
            response.setShowingOriginal(true);
            if (row != null) {
                describeRow(audition, response, row);
            }
        }
        finishLabels(audition, response);
        publishTranslation(response);
    }

    private void rememberOriginal(AuditionResponse response) {
        if (response.getOriginalContent() == null) {
            response.setOriginalContent(AuditionTextSnapshot.capture(response));
        }
    }

    private static void publishTranslation(AuditionResponse response) {
        if (response.isShowingOriginal() || response.isContentLocaleFallback()) {
            response.setTranslationContent(null);
            return;
        }
        response.setTranslationContent(AuditionTextSnapshot.capture(response));
    }

    private List<AuditionTextSnapshot> overlaySnapshots(UUID auditionId) {
        List<AuditionTextSnapshot> overlays = new ArrayList<>();
        for (AuditionTranslation row : translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId)) {
            if (row.getTitle() == null || row.getTitle().isBlank()) {
                continue;
            }
            overlays.add(fromTranslation(row));
        }
        appendContentStore(auditionId, overlays);
        return overlays;
    }

    private static AuditionTextSnapshot fromTranslation(AuditionTranslation row) {
        AuditionTextSnapshot snapshot = new AuditionTextSnapshot();
        snapshot.setTitle(row.getTitle());
        snapshot.setDescription(row.getDescription());
        snapshot.setLocation(row.getLocation());
        snapshot.setAgencyName(row.getAgencyName());
        snapshot.setRecruitFields(row.getRecruitFields());
        snapshot.setQualifications(row.getQualifications());
        snapshot.setSchedules(row.getSchedules());
        snapshot.setBenefits(row.getBenefits());
        return snapshot;
    }

    private void appendContentStore(UUID auditionId, List<AuditionTextSnapshot> overlays) {
        if (contentStore == null || objectMapper == null || auditionId == null) {
            return;
        }
        for (String locale : ContentLocales.SUPPORTED) {
            appendStoreLocale(auditionId, locale, overlays);
        }
    }

    private void appendStoreLocale(UUID auditionId, String locale, List<AuditionTextSnapshot> overlays) {
        try {
            var row = contentStore.findTranslation(ContentTypes.AUDITION_POSTING, auditionId, locale).orElse(null);
            if (row == null || !AuditionTranslation.STATUS_COMPLETED.equals(row.status()) || row.bodyJson() == null) {
                return;
            }
            Map<String, String> fields = objectMapper.readValue(row.bodyJson(), new TypeReference<Map<String, String>>() { });
            String title = fields.get("title");
            if (title == null || title.isBlank()) {
                return;
            }
            AuditionTextSnapshot snapshot = new AuditionTextSnapshot();
            snapshot.setTitle(title);
            String description = fields.get("description");
            snapshot.setDescription(description == null ? "" : description);
            overlays.add(snapshot);
        } catch (Exception ex) {
            // 깨진 번역 본문은 원문 가드에 넣지 않는다.
        }
    }

    @Transactional(readOnly = true)
    public List<AuditionTranslationView> list(UUID auditionId) {
        requireOwnerOrAdmin(auditionId);
        return translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId).stream()
                .map(row -> {
                    AuditionTranslationView view = AuditionTranslationMapper.toView(row);
                    if (attemptRepository != null) {
                        var latest = attemptRepository
                                .findFirstByAuditionIdAndLocaleOrderByStartedAtDesc(row.getAuditionId(), row.getLocale());
                        if (latest != null) {
                            latest.ifPresent(attempt -> AuditionTranslationMapper.attachAttempt(view, attempt));
                        }
                    }
                    return view;
                })
                .toList();
    }

    @Transactional
    public AuditionTranslationView upsert(UUID auditionId, String localeRaw, AuditionTranslationUpsertRequest body) {
        requireOwnerOrAdmin(auditionId);
        if (!ContentLocales.isSupported(localeRaw)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 locale입니다.");
        }
        String locale = ContentLocales.normalize(localeRaw);
        if (body.getTitle() == null || body.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "번역 제목은 필수입니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        Instant now = Instant.now();
        var existing = translationRepository.findById(new AuditionTranslationId(auditionId, locale));
        if (existing.isPresent() && translationUnchanged(existing.get(), body, audition)) {
            return AuditionTranslationMapper.toView(existing.get());
        }
        AuditionTranslation row = existing.orElseGet(() -> {
            AuditionTranslation created = new AuditionTranslation();
            created.setAuditionId(auditionId);
            created.setLocale(locale);
            created.setCreatedAt(now);
            created.setProvider(AuditionTranslation.PROVIDER_MANUAL);
            return created;
        });
        row.setTitle(body.getTitle().trim());
        row.setDescription(nullToEmpty(body.getDescription()));
        row.setLocation(nullToEmpty(body.getLocation()));
        row.setAgencyName(nullToEmpty(body.getAgencyName()));
        row.setRecruitFields(com.audition.platform.domain.audition.RecruitFieldCodes.normalizeAll(toArray(body.getRecruitFields())));
        row.setQualifications(toArray(body.getQualifications()));
        row.setSchedules(toArray(body.getSchedules()));
        row.setBenefits(toArray(body.getBenefits()));
        row.setStatus(AuditionTranslation.STATUS_COMPLETED);
        row.setProvider(AuditionTranslation.PROVIDER_MANUAL);
        row.setOrigin(AuditionTranslation.ORIGIN_MANUAL);
        row.setManuallyEdited(true);
        row.setStale(false);
        row.setErrorCode(null);
        row.setErrorMessage(null);
        row.setSourceHash(AuditionSourceFingerprint.hash(audition));
        row.setSourceFieldHashes(SourceFieldHashes.ofAudition(audition));
        row.setSourceRevision(audition.getContentRevision());
        row.setUpdatedAt(now);
        return AuditionTranslationMapper.toView(translationRepository.save(row));
    }

    private void requireOwnerOrAdmin(UUID auditionId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!SecurityUtils.hasRole("ADMIN") && !SecurityUtils.hasRole("SUPER_ADMIN")
                && !audition.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner or ADMIN can manage translations");
        }
    }

    private static void overlay(AuditionResponse response, AuditionTranslation row) {
        response.setTitle(row.getTitle());
        response.setDescription(safeText(row.getDescription()));
        response.setLocation(safeText(row.getLocation()));
        response.setAgencyName(safeText(row.getAgencyName()));
        response.setRecruitFields(com.audition.platform.domain.audition.RecruitFieldCodes.normalizeAll(row.getRecruitFields()));
        response.setQualifications(row.getQualifications() != null ? row.getQualifications() : new String[0]);
        response.setSchedules(row.getSchedules() != null ? row.getSchedules() : new String[0]);
        response.setBenefits(row.getBenefits() != null ? row.getBenefits() : new String[0]);
    }

    /**
     * 저장된 콘텐츠 번역(완료 상태)의 제목·설명만 덮는다. 공급자를 호출하지 않고 큐에도 넣지 않는다.
     * 번역이 없거나 비어 있으면 원문을 그대로 둔다.
     */
    private boolean overlayFromContentStore(Audition audition, AuditionResponse response, String requested) {
        if (contentStore == null || objectMapper == null || audition.getId() == null) {
            return false;
        }
        try {
            var row = contentStore.findTranslation(ContentTypes.AUDITION_POSTING, audition.getId(), requested).orElse(null);
            if (row == null || !AuditionTranslation.STATUS_COMPLETED.equals(row.status()) || row.bodyJson() == null) {
                return false;
            }
            Map<String, String> fields = objectMapper.readValue(row.bodyJson(), new TypeReference<Map<String, String>>() { });
            String title = fields.get("title");
            if (title == null || title.isBlank()) {
                return false;
            }
            response.setTitle(title.trim());
            String description = fields.get("description");
            if (description != null && !description.isBlank()) {
                response.setDescription(description.trim());
            }
            response.setTranslationStatus(row.status());
            response.setTranslationOrigin(row.origin());
            response.setTranslationStale(row.stale());
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private static String safeText(String raw) {
        return raw == null ? "" : raw;
    }

    private void reconcileRows(UUID auditionId, String fields, String hash, boolean markMissingBaseline) {
        Instant now = Instant.now();
        List<AuditionTranslation> dirty = new ArrayList<>();
        for (AuditionTranslation row : translationRepository.findByAuditionIdOrderByLocaleAsc(auditionId)) {
            boolean next = nextStale(row, fields, hash, markMissingBaseline);
            if (row.isStale() == next) {
                continue;
            }
            row.setStale(next);
            row.setUpdatedAt(now);
            dirty.add(row);
        }
        if (!dirty.isEmpty()) {
            translationRepository.saveAll(dirty);
        }
    }

    private static boolean nextStale(AuditionTranslation row, String fields, String hash, boolean markMissingBaseline) {
        boolean hasBaseline = present(row.getSourceFieldHashes()) || present(row.getSourceHash());
        if (!hasBaseline) {
            return markMissingBaseline || row.isStale();
        }
        return SourceFieldHashes.differs(row.getSourceFieldHashes(), fields, row.getSourceHash(), hash);
    }

    private static boolean translationUnchanged(
            AuditionTranslation row, AuditionTranslationUpsertRequest body, Audition audition) {
        if (!sameText(row.getTitle(), body.getTitle()) || !sameText(row.getDescription(), body.getDescription())) {
            return false;
        }
        if (!sameText(row.getLocation(), body.getLocation()) || !sameText(row.getAgencyName(), body.getAgencyName())) {
            return false;
        }
        if (!sameList(row.getRecruitFields(), body.getRecruitFields(), true)) {
            return false;
        }
        if (!sameList(row.getQualifications(), body.getQualifications(), false)
                || !sameList(row.getSchedules(), body.getSchedules(), false)
                || !sameList(row.getBenefits(), body.getBenefits(), false)) {
            return false;
        }
        if (!row.isManuallyEdited() || !AuditionTranslation.ORIGIN_MANUAL.equals(row.getOrigin())) {
            return false;
        }
        if (!AuditionTranslation.STATUS_COMPLETED.equals(row.getStatus()) || row.isStale()) {
            return false;
        }
        if (!present(row.getSourceFieldHashes()) && !present(row.getSourceHash())) {
            return true;
        }
        String fields = SourceFieldHashes.ofAudition(audition);
        String hash = AuditionSourceFingerprint.hash(audition);
        return !SourceFieldHashes.differs(row.getSourceFieldHashes(), fields, row.getSourceHash(), hash);
    }

    private static boolean sameText(String stored, String incoming) {
        return nullToEmpty(stored).equals(nullToEmpty(incoming));
    }

    private static boolean sameList(String[] stored, java.util.List<String> incoming, boolean recruitCodes) {
        String[] next = recruitCodes
                ? com.audition.platform.domain.audition.RecruitFieldCodes.normalizeAll(toArray(incoming))
                : toArray(incoming);
        return java.util.Arrays.equals(stored == null ? new String[0] : stored, next);
    }

    private static boolean present(String raw) {
        return raw != null && !raw.isBlank();
    }

    private static boolean canOverlay(AuditionTranslation row, boolean preview) {
        if (row == null || row.getTitle() == null || row.getTitle().isBlank()) {
            return false;
        }
        if (preview) {
            return true;
        }
        return AuditionTranslation.STATUS_COMPLETED.equals(row.getStatus());
    }

    private static void describeRow(Audition audition, AuditionResponse response, AuditionTranslation row) {
        response.setTranslationStatus(row.getStatus());
        response.setTranslationErrorCode(row.getErrorCode());
        response.setTranslationOrigin(row.getOrigin());
        String fields = SourceFieldHashes.ofAudition(audition);
        String hash = AuditionSourceFingerprint.hash(audition);
        response.setTranslationStale(nextStale(row, fields, hash, false));
    }

    private static void finishLabels(Audition audition, AuditionResponse response) {
        response.setDisplayTitle(AuditionSeriesPresentation.displayTitle(
                response.getTitle(), audition.getSeriesRound(), response.getContentLocale()));
        response.setRecruitmentRoundLabel(AuditionSeriesPresentation.recruitmentRoundLabel(
                audition.getStatus(), audition.getSeriesRound(), response.getContentLocale()));
        if (response.getApplyBlockedMessage() != null) {
            response.setApplyBlockedMessage(
                    AuditionSeriesPresentation.applyBlockedMessage(response.getContentLocale()));
        }
    }

    private static String authoringLocale(Audition audition) {
        String tag = ContentLocales.canonicalTag(audition.getDefaultLocale());
        return tag.isEmpty() ? ContentLocales.DEFAULT : tag;
    }

    private static String viewingLocale(String requestedRaw, String original) {
        String requestedTag = ContentLocales.canonicalTag(requestedRaw);
        if (!requestedTag.isEmpty() && requestedTag.equals(original)) {
            return original;
        }
        if (ContentLocales.isSupported(requestedRaw)) {
            return ContentLocales.normalize(requestedRaw);
        }
        return requestedTag.isEmpty() ? ContentLocales.DEFAULT : requestedTag;
    }

    private static String nullToEmpty(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String[] toArray(List<String> values) {
        if (values == null || values.isEmpty()) {
            return new String[0];
        }
        return values.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).toArray(String[]::new);
    }
}
