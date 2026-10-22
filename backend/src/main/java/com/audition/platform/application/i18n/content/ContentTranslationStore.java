package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ContentTranslationStore {

    Optional<StoredTranslation> findTranslation(String type, UUID id, String locale);

    void insertTranslation(StoredTranslation row);

    boolean compareAndSet(StoredTranslation row, long expectedVersion);

    void markStaleWhereHashDiffers(String type, UUID id, String hash);

    UUID insertAttempt(NewAttempt attempt);

    void finishAttempt(AttemptFinish finish);

    Optional<StoredAttempt> latestAttempt(String type, UUID id, String locale);

    /** 활성 작업이 이미 있으면 empty. */
    Optional<UUID> insertPendingJob(NewJob job);

    Optional<StoredJob> findActiveJob(String type, UUID id, String locale);

    Optional<StoredJob> findLatestJob(String type, UUID id, String locale);

    Optional<StoredJob> claim(String workerId, int leaseSeconds);

    void finishJob(UUID id, String status, String errorCode, String message);

    void requeue(UUID id, int attemptCount, Instant runAfter, String errorCode, String message);

    void updateAttemptCount(UUID id, int attemptCount);

    int countUserJobsSince(UUID userId, Instant since);

    int countAnonymousJobsSince(Instant since);

    int countAgencyJobsSince(UUID agencyId, Instant since);

    int countGlobalJobsSince(Instant since);

    long sumUserCostSince(UUID userId, Instant since);

    long sumAgencyCostSince(UUID agencyId, Instant since);

    long sumGlobalCostSince(Instant since);

    long sumGlobalBilledCharactersSince(Instant since);
}
