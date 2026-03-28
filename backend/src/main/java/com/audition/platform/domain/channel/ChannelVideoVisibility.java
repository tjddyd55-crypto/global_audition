package com.audition.platform.domain.channel;

/**
 * 채널 영상 공개 범위. DB {@code channel_videos.visibility} 문자열과 동기화.
 * <p>
 * {@link #SUBSCRIBERS_ONLY} 향후 "구독자만" 노출·시청 정책 확장 시 동일 컬럼으로 처리한다.
 */
public final class ChannelVideoVisibility {

    public static final String PUBLIC = "PUBLIC";
    public static final String PRIVATE = "PRIVATE";
    /** 채널 페이지에는 비노출, 구독자·본인만 상세·시청 API 허용(본 서비스 로직에서 처리). */
    public static final String SUBSCRIBERS_ONLY = "SUBSCRIBERS_ONLY";

    private ChannelVideoVisibility() {}

    public static boolean isKnown(String raw) {
        if (raw == null || raw.isBlank()) {
            return false;
        }
        String v = raw.trim().toUpperCase();
        return PUBLIC.equals(v) || PRIVATE.equals(v) || SUBSCRIBERS_ONLY.equals(v);
    }
}
