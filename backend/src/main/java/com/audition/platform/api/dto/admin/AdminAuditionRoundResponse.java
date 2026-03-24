package com.audition.platform.api.dto.admin;

import java.time.Instant;
import java.util.UUID;

public class AdminAuditionRoundResponse {

    private UUID id;
    private int roundNumber;
    private String roundName;
    private String reviewMethod;
    private String requiredSubmissionType;
    private Instant startAt;
    private Instant endAt;
    private boolean active;
    private long submissionCount;
    private long passedCount;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }

    public String getRoundName() {
        return roundName;
    }

    public void setRoundName(String roundName) {
        this.roundName = roundName;
    }

    public String getReviewMethod() {
        return reviewMethod;
    }

    public void setReviewMethod(String reviewMethod) {
        this.reviewMethod = reviewMethod;
    }

    public String getRequiredSubmissionType() {
        return requiredSubmissionType;
    }

    public void setRequiredSubmissionType(String requiredSubmissionType) {
        this.requiredSubmissionType = requiredSubmissionType;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public void setEndAt(Instant endAt) {
        this.endAt = endAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getSubmissionCount() {
        return submissionCount;
    }

    public void setSubmissionCount(long submissionCount) {
        this.submissionCount = submissionCount;
    }

    public long getPassedCount() {
        return passedCount;
    }

    public void setPassedCount(long passedCount) {
        this.passedCount = passedCount;
    }
}
