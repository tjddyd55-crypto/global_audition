package com.audition.platform.api.dto;

public class ManageApplicationStatsDto {

    private long total;
    private long submitted;
    private long reviewing;
    private long accepted;
    private long rejected;

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getSubmitted() {
        return submitted;
    }

    public void setSubmitted(long submitted) {
        this.submitted = submitted;
    }

    public long getReviewing() {
        return reviewing;
    }

    public void setReviewing(long reviewing) {
        this.reviewing = reviewing;
    }

    public long getAccepted() {
        return accepted;
    }

    public void setAccepted(long accepted) {
        this.accepted = accepted;
    }

    public long getRejected() {
        return rejected;
    }

    public void setRejected(long rejected) {
        this.rejected = rejected;
    }
}
