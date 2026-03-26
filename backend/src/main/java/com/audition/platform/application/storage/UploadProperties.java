package com.audition.platform.application.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 이미지 업로드 정책 — {@code application.yml}의 {@code app.upload.*}와 일치.
 */
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {

    /** 원본·파생 처리 공통 상한 (multipart max와 동일 권장) */
    private long maxImageBytes = 10L * 1024 * 1024;

    private int thumbMaxEdgePx = 300;

    private int mediumMaxEdgePx = 800;

    /** 시간당 업로드 시도 허용 횟수(사용자별). 0 이하면 비활성 */
    private int rateLimitPerUserPerHour = 120;

    /** UTC 일 단위(자정 기준 아님, epoch/86400 버킷). 0 이하면 비활성 */
    private int rateLimitPerUserPerDay = 800;

    public long getMaxImageBytes() {
        return maxImageBytes;
    }

    public void setMaxImageBytes(long maxImageBytes) {
        this.maxImageBytes = maxImageBytes;
    }

    public int getThumbMaxEdgePx() {
        return thumbMaxEdgePx;
    }

    public void setThumbMaxEdgePx(int thumbMaxEdgePx) {
        this.thumbMaxEdgePx = thumbMaxEdgePx;
    }

    public int getMediumMaxEdgePx() {
        return mediumMaxEdgePx;
    }

    public void setMediumMaxEdgePx(int mediumMaxEdgePx) {
        this.mediumMaxEdgePx = mediumMaxEdgePx;
    }

    public int getRateLimitPerUserPerHour() {
        return rateLimitPerUserPerHour;
    }

    public void setRateLimitPerUserPerHour(int rateLimitPerUserPerHour) {
        this.rateLimitPerUserPerHour = rateLimitPerUserPerHour;
    }

    public int getRateLimitPerUserPerDay() {
        return rateLimitPerUserPerDay;
    }

    public void setRateLimitPerUserPerDay(int rateLimitPerUserPerDay) {
        this.rateLimitPerUserPerDay = rateLimitPerUserPerDay;
    }
}
