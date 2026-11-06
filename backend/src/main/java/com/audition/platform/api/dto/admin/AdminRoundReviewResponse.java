package com.audition.platform.api.dto.admin;

import java.util.UUID;

/**
 * 다단계 합격/불합격/보류 응답.
 * 영속 엔티티의 지연 로딩 연관을 포함하지 않는다.
 */
public class AdminRoundReviewResponse {

    private final UUID submissionId;
    private final UUID applicationId;
    private final UUID roundId;
    private final int roundNumber;
    private final String submissionStatus;
    private final String reviewerNote;
    private final String applicationStatus;
    private final int currentRoundNumber;
    private final String finalStatus;
    private final String latestResultStatus;

    public AdminRoundReviewResponse(
            UUID submissionId,
            UUID applicationId,
            UUID roundId,
            int roundNumber,
            String submissionStatus,
            String reviewerNote,
            String applicationStatus,
            int currentRoundNumber,
            String finalStatus,
            String latestResultStatus) {
        this.submissionId = submissionId;
        this.applicationId = applicationId;
        this.roundId = roundId;
        this.roundNumber = roundNumber;
        this.submissionStatus = submissionStatus;
        this.reviewerNote = reviewerNote;
        this.applicationStatus = applicationStatus;
        this.currentRoundNumber = currentRoundNumber;
        this.finalStatus = finalStatus;
        this.latestResultStatus = latestResultStatus;
    }

    public UUID getSubmissionId() {
        return submissionId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public UUID getRoundId() {
        return roundId;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public String getReviewerNote() {
        return reviewerNote;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public int getCurrentRoundNumber() {
        return currentRoundNumber;
    }

    public String getFinalStatus() {
        return finalStatus;
    }

    public String getLatestResultStatus() {
        return latestResultStatus;
    }
}
