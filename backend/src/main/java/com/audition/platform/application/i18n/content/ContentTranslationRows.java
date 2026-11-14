package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.translation.ProviderUsage;

import java.time.Instant;
import java.util.UUID;

public final class ContentTranslationRows {

    private ContentTranslationRows() {
    }

    public record StoredTranslation(
            String contentType,
            UUID contentId,
            String locale,
            String sourceLocale,
            String sourceHash,
            Long sourceRevision,
            String bodyJson,
            String status,
            boolean stale,
            String provider,
            String origin,
            boolean manuallyEdited,
            long rowVersion,
            String errorCode,
            String errorMessage,
            String sourceFieldHashes) {
    }

    public record StoredJob(
            UUID id,
            String contentType,
            UUID contentId,
            String locale,
            String sourceHash,
            UUID requestedBy,
            UUID agencyId,
            String status,
            int attemptCount,
            int maxAttempts,
            boolean force,
            String errorCode) {
    }

    public record NewJob(
            UUID id,
            String contentType,
            UUID contentId,
            String locale,
            String sourceHash,
            UUID requestedBy,
            UUID agencyId,
            int maxAttempts,
            boolean force,
            Instant runAfter,
            String errorCode) {

        /** 바로 실행할 작업. */
        public NewJob(UUID id, String contentType, UUID contentId, String locale, String sourceHash,
                      UUID requestedBy, UUID agencyId, int maxAttempts, boolean force) {
            this(id, contentType, contentId, locale, sourceHash, requestedBy, agencyId, maxAttempts, force, null, null);
        }
    }

    public record NewAttempt(
            UUID id,
            String contentType,
            UUID contentId,
            String locale,
            UUID jobId,
            UUID requestedBy,
            UUID agencyId,
            String provider) {
    }

    public record StoredAttempt(
            UUID id,
            String status,
            String errorCode,
            Integer promptTokens,
            Integer completionTokens,
            Integer totalTokens,
            Long estimatedCostMicroUsd) {
    }

    public record AttemptFinish(
            UUID id,
            String status,
            String errorCode,
            String errorMessage,
            ProviderUsage usage,
            Long estimatedCostMicroUsd) {
    }

    public record ContentSnapshot(
            String contentType,
            UUID contentId,
            String sourceLocale,
            java.util.Map<String, String> fields,
            UUID ownerUserId,
            UUID agencyUserId) {
    }
}
