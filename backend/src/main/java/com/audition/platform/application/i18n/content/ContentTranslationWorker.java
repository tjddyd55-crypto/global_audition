package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.TranslationAttemptRecorder;
import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;
import com.audition.platform.application.i18n.translation.TranslationDocumentDraft;
import com.audition.platform.application.i18n.translation.TranslationDraftValidator;
import com.audition.platform.application.i18n.translation.TranslationProvider;
import com.audition.platform.application.i18n.translation.TranslationProviderException;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * DB 큐를 임대(lease)로 가져간다. 프로세스가 죽으면 만료된 RUNNING 행을 다음 기동이 다시 집는다.
 */
@Service
public class ContentTranslationWorker {

    private static final Logger log = LoggerFactory.getLogger(ContentTranslationWorker.class);

    private final String workerId = UUID.randomUUID().toString();
    private final ContentTranslationStore store;
    private final List<ContentTranslationSource> sources;
    private final TranslationProvider provider;
    private final TranslationAttemptRecorder attempts;
    private final TranslationCostEstimator costs;
    private final TranslationQueueProperties properties;
    private final ObjectMapper objectMapper;

    public ContentTranslationWorker(
            ContentTranslationStore store,
            List<ContentTranslationSource> sources,
            TranslationProvider provider,
            TranslationAttemptRecorder attempts,
            TranslationCostEstimator costs,
            TranslationQueueProperties properties,
            ObjectMapper objectMapper) {
        this.store = store;
        this.sources = sources;
        this.provider = provider;
        this.attempts = attempts;
        this.costs = costs;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public int drain() {
        int handled = 0;
        for (int i = 0; i < properties.getDrainBatch(); i++) {
            Optional<StoredJob> job = store.claim(workerId, properties.getLeaseSeconds());
            if (job.isEmpty()) {
                break;
            }
            process(job.get());
            handled++;
        }
        return handled;
    }

    private void process(StoredJob job) {
        try {
            translate(job);
        } catch (RuntimeException ex) {
            log.warn("content translation job {} failed before completion", job.id(), ex);
            store.finishJob(job.id(), ContentTypes.JOB_FAILED, AuditionTranslation.ERROR_PROVIDER, "translation worker failed");
        }
    }

    private void translate(StoredJob job) {
        ContentTranslationSource source = sources.stream()
                .filter(item -> item.type().equals(job.contentType()))
                .findFirst()
                .orElse(null);
        if (source == null) {
            blocked(job, ContentTypes.CONTENT_NOT_FOUND);
            return;
        }
        Optional<ContentSnapshot> loaded = source.load(job.contentId());
        if (loaded.isEmpty()) {
            blocked(job, ContentTypes.CONTENT_NOT_FOUND);
            return;
        }
        ContentSnapshot snapshot = loaded.get();
        StoredTranslation existing = store.findTranslation(job.contentType(), job.contentId(), job.locale()).orElse(null);
        if (existing != null && (existing.manuallyEdited() || AuditionTranslation.ORIGIN_MANUAL.equals(existing.origin())) && !job.force()) {
            blocked(job, ContentTypes.TRANSLATION_PROTECTED);
            return;
        }
        int attemptNumber = job.attemptCount() + 1;
        store.updateAttemptCount(job.id(), attemptNumber);
        if (!provider.isConfigured()) {
            blocked(job, ContentTypes.NOT_CONFIGURED);
            return;
        }
        UUID attemptId = attempts.startContent(new NewAttempt(
                UUID.randomUUID(), job.contentType(), job.contentId(), job.locale(), job.id(),
                job.requestedBy(), job.agencyId(), provider.providerId()));
        try {
            TranslationDocumentDraft draft = provider.translateDocument(snapshot.sourceLocale(), snapshot.fields(), job.locale());
            TranslationDraftValidator.validateFields(snapshot.fields(), draft.fields());
            Long cost = costs.estimateMicroUsd(draft.usage());
            saveAuto(snapshot, job, existing, draft);
            attempts.finishContent(new AttemptFinish(
                    attemptId, AuditionTranslation.STATUS_COMPLETED, null, null, draft.usage(), cost));
            store.finishJob(job.id(), ContentTypes.JOB_COMPLETED, null, null);
        } catch (TranslationProviderException ex) {
            attempts.finishContent(new AttemptFinish(
                    attemptId, AuditionTranslation.STATUS_FAILED, ex.getErrorCode(), ex.getMessage(), null, null));
            if (AuditionTranslation.ERROR_NOT_CONFIGURED.equals(ex.getErrorCode())) {
                store.finishJob(job.id(), ContentTypes.JOB_BLOCKED, ex.getErrorCode(), ex.getMessage());
                return;
            }
            if (attemptNumber < job.maxAttempts()) {
                store.requeue(job.id(), attemptNumber, Instant.now().plusSeconds(attemptNumber * 2L), ex.getErrorCode(), ex.getMessage());
                return;
            }
            store.finishJob(job.id(), ContentTypes.JOB_FAILED, ex.getErrorCode(), ex.getMessage());
        }
    }

    private void blocked(StoredJob job, String code) {
        UUID attemptId = attempts.startContent(new NewAttempt(
                UUID.randomUUID(), job.contentType(), job.contentId(), job.locale(), job.id(),
                job.requestedBy(), job.agencyId(), provider.providerId()));
        attempts.finishContent(new AttemptFinish(attemptId, ContentTypes.JOB_BLOCKED, code, code, null, null));
        store.finishJob(job.id(), ContentTypes.JOB_BLOCKED, code, code);
    }

    private void saveAuto(ContentSnapshot snapshot, StoredJob job, StoredTranslation existing, TranslationDocumentDraft draft) {
        StoredTranslation current = store.findTranslation(job.contentType(), job.contentId(), job.locale()).orElse(existing);
        if (current != null && (current.manuallyEdited() || AuditionTranslation.ORIGIN_MANUAL.equals(current.origin())) && !job.force()) {
            throw new TranslationProviderException(ContentTypes.TRANSLATION_PROTECTED, ContentTypes.TRANSLATION_PROTECTED);
        }
        String hash = ContentSourceFingerprint.hash(snapshot.sourceLocale(), snapshot.fields());
        long revision = 1L;
        if (current != null && current.sourceRevision() != null) {
            revision = hash.equals(current.sourceHash()) ? current.sourceRevision() : current.sourceRevision() + 1;
        }
        String json;
        try {
            json = objectMapper.writeValueAsString(draft.fields());
        } catch (Exception e) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_MALFORMED_JSON, "번역 본문을 저장하지 못했습니다.");
        }
        StoredTranslation row = new StoredTranslation(
                job.contentType(), job.contentId(), job.locale(), snapshot.sourceLocale(), hash, revision, json,
                AuditionTranslation.STATUS_COMPLETED, false, provider.providerId(), AuditionTranslation.ORIGIN_AUTO,
                false, current == null ? 0L : current.rowVersion(), null, null);
        if (current == null) {
            store.insertTranslation(row);
            return;
        }
        if (!store.compareAndSet(row, current.rowVersion())) {
            throw new TranslationProviderException(ContentTypes.CONCURRENT_EDIT, ContentTypes.CONCURRENT_EDIT);
        }
    }
}
