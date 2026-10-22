package com.audition.platform.application.i18n.content;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    }

    private static boolean overCost(long cap, long used) {
        return cap > 0 && used >= cap;
    }

    private static void reject(String code) {
        throw new ContentTranslationLimitException(code, HttpStatus.TOO_MANY_REQUESTS);
    }
}
