package com.audition.platform.api.dto.admin;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AdminCreateAuditionRoundRequest {

    @Size(max = 500)
    private String roundName;

    @Pattern(regexp = "INTERNAL_REVIEW|PUBLIC_VOTE|FINAL_SELECTION")
    private String reviewMethod = "INTERNAL_REVIEW";

    @Pattern(regexp = "VIDEO|FILE|TEXT|MIXED")
    private String requiredSubmissionType = "VIDEO";

    private String startAt;
    private String endAt;

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

    public String getStartAt() {
        return startAt;
    }

    public void setStartAt(String startAt) {
        this.startAt = startAt;
    }

    public String getEndAt() {
        return endAt;
    }

    public void setEndAt(String endAt) {
        this.endAt = endAt;
    }
}
