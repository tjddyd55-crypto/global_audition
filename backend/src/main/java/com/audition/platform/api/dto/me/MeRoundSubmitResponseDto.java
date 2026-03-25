package com.audition.platform.api.dto.me;

/**
 * POST /api/me/.../submit 성공 응답 본문 (상위는 {@link com.audition.platform.api.dto.ApiEnvelope}).
 */
public class MeRoundSubmitResponseDto {

    private String submissionStatus;
    private int roundNumber;

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }
}
