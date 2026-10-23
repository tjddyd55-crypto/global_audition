package com.audition.platform.application.i18n.content;

import com.audition.platform.application.i18n.content.ContentTranslationRows.AttemptFinish;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredAttempt;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

/** 단위 테스트용 저장소. 활성 작업 키는 하나다. 임대가 지난 RUNNING 은 다시 집는다. */
public class MemoryContentTranslationStore implements ContentTranslationStore {

    private final List<StoredTranslation> translations = new CopyOnWriteArrayList<>();
    private final List<MutableJob> jobs = new CopyOnWriteArrayList<>();
    private final List<MutableAttempt> attempts = new CopyOnWriteArrayList<>();

    public void expireLeases() {
        synchronized (this) {
            for (MutableJob job : jobs) {
                if (ContentTypes.JOB_RUNNING.equals(job.status)) {
                    job.leaseUntil = Instant.EPOCH;
                }
            }
        }
    }

    @Override
    public synchronized Optional<StoredTranslation> findTranslation(String type, UUID id, String locale) {
        return translations.stream()
                .filter(row -> row.contentType().equals(type) && row.contentId().equals(id) && row.locale().equals(locale))
                .findFirst();
    }

    @Override
    public synchronized void insertTranslation(StoredTranslation row) {
        translations.add(row);
    }

    @Override
    public synchronized boolean compareAndSet(StoredTranslation row, long expectedVersion) {
        for (int i = 0; i < translations.size(); i++) {
            StoredTranslation current = translations.get(i);
            if (current.contentType().equals(row.contentType())
                    && current.contentId().equals(row.contentId())
                    && current.locale().equals(row.locale())
                    && current.rowVersion() == expectedVersion) {
                translations.set(i, new StoredTranslation(
                        row.contentType(), row.contentId(), row.locale(), row.sourceLocale(), row.sourceHash(),
                        row.sourceRevision(), row.bodyJson(), row.status(), row.stale(), row.provider(), row.origin(),
                        row.manuallyEdited(), expectedVersion + 1, row.errorCode(), row.errorMessage()));
                return true;
            }
        }
        return false;
    }

    @Override
    public synchronized void markStaleWhereHashDiffers(String type, UUID id, String hash) {
        for (int i = 0; i < translations.size(); i++) {
            StoredTranslation current = translations.get(i);
            if (current.contentType().equals(type) && current.contentId().equals(id)
                    && (current.sourceHash() == null || !current.sourceHash().equals(hash))) {
                translations.set(i, new StoredTranslation(
                        current.contentType(), current.contentId(), current.locale(), current.sourceLocale(),
                        current.sourceHash(), current.sourceRevision(), current.bodyJson(), current.status(), true,
                        current.provider(), current.origin(), current.manuallyEdited(), current.rowVersion(),
                        current.errorCode(), current.errorMessage()));
            }
        }
    }

    @Override
    public synchronized UUID insertAttempt(NewAttempt attempt) {
        attempts.add(new MutableAttempt(attempt));
        return attempt.id();
    }

    @Override
    public synchronized void finishAttempt(AttemptFinish finish) {
        for (MutableAttempt attempt : attempts) {
            if (attempt.id.equals(finish.id())) {
                attempt.status = finish.status();
                attempt.errorCode = finish.errorCode();
                attempt.usage = finish.usage();
                attempt.cost = finish.estimatedCostMicroUsd();
            }
        }
    }

    @Override
    public synchronized Optional<StoredAttempt> latestAttempt(String type, UUID id, String locale) {
        return attempts.stream()
                .filter(row -> row.type.equals(type) && row.contentId.equals(id) && row.locale.equals(locale))
                .max(Comparator.comparing(row -> row.startedAt))
                .map(MutableAttempt::stored);
    }

    @Override
    public synchronized Optional<UUID> insertPendingJob(NewJob job) {
        boolean active = jobs.stream().anyMatch(row -> row.sameKey(job.contentType(), job.contentId(), job.locale())
                && (ContentTypes.JOB_PENDING.equals(row.status) || ContentTypes.JOB_RUNNING.equals(row.status)));
        if (active) {
            return Optional.empty();
        }
        jobs.add(new MutableJob(job));
        return Optional.of(job.id());
    }

    @Override
    public synchronized Optional<StoredJob> findActiveJob(String type, UUID id, String locale) {
        return jobs.stream()
                .filter(row -> row.sameKey(type, id, locale)
                        && (ContentTypes.JOB_PENDING.equals(row.status) || ContentTypes.JOB_RUNNING.equals(row.status)))
                .map(MutableJob::stored)
                .findFirst();
    }

    @Override
    public synchronized Optional<StoredJob> findLatestJob(String type, UUID id, String locale) {
        return jobs.stream()
                .filter(row -> row.sameKey(type, id, locale))
                .max(Comparator.comparing(row -> row.createdAt))
                .map(MutableJob::stored);
    }

    @Override
    public synchronized Optional<StoredJob> claim(String workerId, int leaseSeconds) {
        Instant now = Instant.now();
        Optional<MutableJob> candidate = jobs.stream()
                .filter(row -> ContentTypes.JOB_PENDING.equals(row.status) && (row.runAfter == null || !row.runAfter.isAfter(now))
                        || ContentTypes.JOB_RUNNING.equals(row.status) && row.leaseUntil != null && row.leaseUntil.isBefore(now))
                .min(Comparator.comparing(row -> row.createdAt));
        if (candidate.isEmpty()) {
            return Optional.empty();
        }
        MutableJob job = candidate.get();
        job.status = ContentTypes.JOB_RUNNING;
        job.leaseUntil = now.plusSeconds(leaseSeconds);
        return Optional.of(job.stored());
    }

    @Override
    public synchronized void finishJob(UUID id, String status, String errorCode, String message) {
        jobs.stream().filter(row -> row.id.equals(id)).findFirst().ifPresent(row -> {
            row.status = status;
            row.errorCode = errorCode;
            row.leaseUntil = null;
        });
    }

    @Override
    public synchronized void requeue(UUID id, int attemptCount, Instant runAfter, String errorCode, String message) {
        jobs.stream().filter(row -> row.id.equals(id)).findFirst().ifPresent(row -> {
            row.status = ContentTypes.JOB_PENDING;
            row.attemptCount = attemptCount;
            row.runAfter = runAfter;
            row.errorCode = errorCode;
            row.leaseUntil = null;
        });
    }

    @Override
    public synchronized void updateAttemptCount(UUID id, int attemptCount) {
        jobs.stream().filter(row -> row.id.equals(id)).findFirst().ifPresent(row -> row.attemptCount = attemptCount);
    }

    @Override
    public synchronized int countUserJobsSince(UUID userId, Instant since) {
        return (int) jobs.stream().filter(row -> userId.equals(row.requestedBy) && !row.createdAt.isBefore(since)).count();
    }

    @Override
    public synchronized int countAnonymousJobsSince(Instant since) {
        return (int) jobs.stream().filter(row -> row.requestedBy == null && !row.createdAt.isBefore(since)).count();
    }

    @Override
    public synchronized int countAgencyJobsSince(UUID agencyId, Instant since) {
        return (int) jobs.stream().filter(row -> agencyId.equals(row.agencyId) && !row.createdAt.isBefore(since)).count();
    }

    @Override
    public synchronized int countGlobalJobsSince(Instant since) {
        return (int) jobs.stream().filter(row -> !row.createdAt.isBefore(since)).count();
    }

    @Override
    public synchronized long sumUserCostSince(UUID userId, Instant since) {
        return attempts.stream()
                .filter(row -> userId.equals(row.requestedBy) && !row.startedAt.isBefore(since) && row.cost != null)
                .mapToLong(row -> row.cost)
                .sum();
    }

    @Override
    public synchronized long sumAgencyCostSince(UUID agencyId, Instant since) {
        return attempts.stream()
                .filter(row -> agencyId.equals(row.agencyId) && !row.startedAt.isBefore(since) && row.cost != null)
                .mapToLong(row -> row.cost)
                .sum();
    }

    @Override
    public synchronized long sumGlobalCostSince(Instant since) {
        return attempts.stream()
                .filter(row -> !row.startedAt.isBefore(since) && row.cost != null)
                .mapToLong(row -> row.cost)
                .sum();
    }

    @Override
    public synchronized long sumGlobalBilledCharactersSince(Instant since) {
        return attempts.stream()
                .filter(row -> !row.startedAt.isBefore(since) && row.usage != null && row.usage.billedCharacters() != null)
                .mapToLong(row -> row.usage.billedCharacters())
                .sum();
    }

    public synchronized List<StoredTranslation> translations() {
        return new ArrayList<>(translations);
    }

    private static final class MutableJob {
        private final UUID id;
        private final String type;
        private final UUID contentId;
        private final String locale;
        private final String sourceHash;
        private final UUID requestedBy;
        private final UUID agencyId;
        private final int maxAttempts;
        private final boolean force;
        private final Instant createdAt = Instant.now();
        private String status = ContentTypes.JOB_PENDING;
        private int attemptCount;
        private String errorCode;
        private Instant runAfter;
        private Instant leaseUntil;

        private MutableJob(NewJob job) {
            this.id = job.id();
            this.type = job.contentType();
            this.contentId = job.contentId();
            this.locale = job.locale();
            this.sourceHash = job.sourceHash();
            this.requestedBy = job.requestedBy();
            this.agencyId = job.agencyId();
            this.maxAttempts = job.maxAttempts();
            this.force = job.force();
        }

        private boolean sameKey(String type, UUID id, String locale) {
            return this.type.equals(type) && this.contentId.equals(id) && this.locale.equals(locale);
        }

        private StoredJob stored() {
            return new StoredJob(id, type, contentId, locale, sourceHash, requestedBy, agencyId, status,
                    attemptCount, maxAttempts, force, errorCode);
        }
    }

    private static final class MutableAttempt {
        private final UUID id;
        private final String type;
        private final UUID contentId;
        private final String locale;
        private final UUID requestedBy;
        private final UUID agencyId;
        private final Instant startedAt = Instant.now();
        private String status = ContentTypes.JOB_PENDING;
        private String errorCode;
        private com.audition.platform.application.i18n.translation.ProviderUsage usage;
        private Long cost;

        private MutableAttempt(NewAttempt attempt) {
            this.id = attempt.id();
            this.type = attempt.contentType();
            this.contentId = attempt.contentId();
            this.locale = attempt.locale();
            this.requestedBy = attempt.requestedBy();
            this.agencyId = attempt.agencyId();
        }

        private StoredAttempt stored() {
            return new StoredAttempt(
                    id, status, errorCode,
                    usage == null ? null : usage.promptTokens(),
                    usage == null ? null : usage.completionTokens(),
                    usage == null ? null : usage.totalTokens(),
                    cost);
        }
    }
}
