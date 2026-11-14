package com.audition.platform.application.i18n.content;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Component
public class ContentTranslationQuota {

    private final ContentTranslationStore store;
    private final TranslationQueueProperties properties;

    public ContentTranslationQuota(ContentTranslationStore store, TranslationQueueProperties properties) {
        this.store = store;
        this.properties = properties;
    }

    public void check(UUID userId, UUID agencyId) {
        Instant now = Instant.now();
        Instant minute = now.minus(1, ChronoUnit.MINUTES);
        Instant hour = now.minus(1, ChronoUnit.HOURS);
        Instant day = now.minus(1, ChronoUnit.DAYS);
        if (userId == null) {
            if (store.countAnonymousJobsSince(minute) >= properties.getAnonymousJobsPerMinute()) {
                reject(ContentTypes.RATE_LIMITED);
            }
        } else {
            int perMinute = store.countUserJobsSince(userId, minute);
            int perHour = store.countUserJobsSince(userId, hour);
            if (perMinute >= properties.getUserJobsPerMinute()) {
                reject(ContentTypes.RATE_LIMITED);
            }
            if (perHour >= properties.getAbuseJobsPerHour()) {
                reject(ContentTypes.ABUSE_BLOCKED);
            }
            if (perHour >= properties.getUserJobsPerHour()) {
                reject(ContentTypes.QUOTA_EXCEEDED);
            }
            if (overCost(properties.getUserDailyCostMicroUsd(), store.sumUserCostSince(userId, day))) {
                reject(ContentTypes.QUOTA_EXCEEDED);
            }
        }
        if (agencyId != null) {
            if (store.countAgencyJobsSince(agencyId, hour) >= properties.getAgencyJobsPerHour()) {
                reject(ContentTypes.QUOTA_EXCEEDED);
            }
            if (overCost(properties.getAgencyDailyCostMicroUsd(), store.sumAgencyCostSince(agencyId, day))) {
                reject(ContentTypes.QUOTA_EXCEEDED);
            }
        }
        if (store.countGlobalJobsSince(hour) >= properties.getGlobalJobsPerHour()) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
        if (overCost(properties.getGlobalDailyCostMicroUsd(), store.sumGlobalCostSince(day))) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
        Instant month = monthStart(now);
        if (userId != null && overCost(properties.getUserMonthlyCostMicroUsd(), store.sumUserCostSince(userId, month))) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
        if (agencyId != null && overCost(properties.getAgencyMonthlyCostMicroUsd(), store.sumAgencyCostSince(agencyId, month))) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
        if (overCost(properties.getGlobalMonthlyCostMicroUsd(), store.sumGlobalCostSince(month))) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
        if (overCount(properties.getGlobalMonthlyBilledCharacters(), store.sumGlobalBilledCharactersSince(month))) {
            reject(ContentTypes.QUOTA_EXCEEDED);
        }
    }

    /**
     * 워커가 공급자를 부르기 직전에 본다. 걸리면 작업을 실패시키지 않고 미룰 코드를 돌려준다.
     * 처리량(1분 시도 수)과 전체·기획사 비용·문자 예산만 본다. 요청자별 접수 한도는 접수 때 이미 봤다.
     */
    public Optional<String> executionBlock(UUID agencyId) {
        Instant now = Instant.now();
        if (properties.getWorkerAttemptsPerMinute() > 0
                && store.countAttemptsSince(now.minus(1, ChronoUnit.MINUTES)) >= properties.getWorkerAttemptsPerMinute()) {
            return Optional.of(ContentTypes.RATE_LIMITED);
        }
        Instant day = now.minus(1, ChronoUnit.DAYS);
        Instant month = monthStart(now);
        if (overCost(properties.getGlobalDailyCostMicroUsd(), store.sumGlobalCostSince(day))
                || overCost(properties.getGlobalMonthlyCostMicroUsd(), store.sumGlobalCostSince(month))
                || overCount(properties.getGlobalMonthlyBilledCharacters(), store.sumGlobalBilledCharactersSince(month))) {
            return Optional.of(ContentTypes.QUOTA_EXCEEDED);
        }
        if (agencyId != null && (overCost(properties.getAgencyDailyCostMicroUsd(), store.sumAgencyCostSince(agencyId, day))
                || overCost(properties.getAgencyMonthlyCostMicroUsd(), store.sumAgencyCostSince(agencyId, month)))) {
            return Optional.of(ContentTypes.QUOTA_EXCEEDED);
        }
        return Optional.empty();
    }

    /** 제한 코드별로 다시 시도할 시각. 분당 제한은 짧게, 예산·시간당 제한은 길게 미룬다. */
    public Instant deferUntil(String code) {
        int seconds = ContentTypes.RATE_LIMITED.equals(code)
                ? properties.getRateDeferSeconds()
                : properties.getBudgetDeferSeconds();
        return Instant.now().plusSeconds(Math.max(1, seconds));
    }

    private static Instant monthStart(Instant now) {
        return YearMonth.from(now.atZone(ZoneOffset.UTC)).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private static boolean overCount(long cap, long used) {
        return cap > 0 && used >= cap;
    }

    private static boolean overCost(long cap, long used) {
        return cap > 0 && used >= cap;
    }

    private static void reject(String code) {
        throw new ContentTranslationLimitException(code, HttpStatus.TOO_MANY_REQUESTS);
    }
}
