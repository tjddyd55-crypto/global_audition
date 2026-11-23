package com.audition.platform.application.saves;

import java.time.Instant;

/**
 * 관심 목록에 쓰는 모집 상태. DRAFT·삭제·그 외는 UNAVAILABLE.
 * OPEN 이더라도 startDate 가 미래면 UPCOMING(예정)이다.
 */
public final class AuditionSaveStatus {

    public static final String OPEN = "OPEN";
    public static final String CLOSED = "CLOSED";
    public static final String UPCOMING = "UPCOMING";
    public static final String UNAVAILABLE = "UNAVAILABLE";

    private AuditionSaveStatus() {
    }

    public static String of(String status, Instant startDate, Instant now) {
        if ("CLOSED".equals(status)) {
            return CLOSED;
        }
        if ("OPEN".equals(status)) {
            if (startDate != null && now != null && startDate.isAfter(now)) {
                return UPCOMING;
            }
            return OPEN;
        }
        return UNAVAILABLE;
    }

    public static boolean isPubliclySavable(String status) {
        return "OPEN".equals(status) || "CLOSED".equals(status);
    }
}
