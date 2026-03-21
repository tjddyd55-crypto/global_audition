package com.audition.platform.api.dto.me;

public class MeDashboardStatsDto {

    private long appliedCount;
    private long reviewingCount;
    private long acceptedCount;
    private long rejectedCount;
    private long videoCount;

    public long getAppliedCount() {
        return appliedCount;
    }

    public void setAppliedCount(long appliedCount) {
        this.appliedCount = appliedCount;
    }

    public long getReviewingCount() {
        return reviewingCount;
    }

    public void setReviewingCount(long reviewingCount) {
        this.reviewingCount = reviewingCount;
    }

    public long getAcceptedCount() {
        return acceptedCount;
    }

    public void setAcceptedCount(long acceptedCount) {
        this.acceptedCount = acceptedCount;
    }

    public long getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(long rejectedCount) {
        this.rejectedCount = rejectedCount;
    }

    public long getVideoCount() {
        return videoCount;
    }

    public void setVideoCount(long videoCount) {
        this.videoCount = videoCount;
    }
}
