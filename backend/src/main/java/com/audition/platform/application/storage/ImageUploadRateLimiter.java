package com.audition.platform.application.storage;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 인증된 사용자별 이미지 업로드 횟수 제한 (인메모리, 단일 인스턴스 기준).
 * 다중 인스턴스에서는 Redis 등 외부 저장소로 교체 권장.
 */
@Component
public class ImageUploadRateLimiter {

    private final int maxPerHour;
    private final int maxPerDay;

    private static final class Counter {
        private long hourBucket = -1;
        private int hourCount;
        private long dayBucket = -1;
        private int dayCount;
    }

    private final ConcurrentHashMap<UUID, Counter> counters = new ConcurrentHashMap<>();

    public ImageUploadRateLimiter(UploadProperties uploadProperties) {
        this.maxPerHour = uploadProperties.getRateLimitPerUserPerHour();
        this.maxPerDay = uploadProperties.getRateLimitPerUserPerDay();
    }

    /**
     * 한도 초과 시 429.
     */
    public void checkAndRecord(UUID userId) {
        if (userId == null) {
            return;
        }
        if (maxPerHour <= 0 && maxPerDay <= 0) {
            return;
        }

        Counter c = counters.computeIfAbsent(userId, k -> new Counter());
        synchronized (c) {
            long hour = Instant.now().getEpochSecond() / 3600L;
            long day = Instant.now().getEpochSecond() / 86400L;
            if (c.hourBucket != hour) {
                c.hourBucket = hour;
                c.hourCount = 0;
            }
            if (c.dayBucket != day) {
                c.dayBucket = day;
                c.dayCount = 0;
            }
            if (maxPerHour > 0 && c.hourCount >= maxPerHour) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "이미지 업로드 시간당 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."
                );
            }
            if (maxPerDay > 0 && c.dayCount >= maxPerDay) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "이미지 업로드 일일 한도를 초과했습니다. 내일 다시 시도해 주세요."
                );
            }
            c.hourCount++;
            c.dayCount++;
        }
    }
}
