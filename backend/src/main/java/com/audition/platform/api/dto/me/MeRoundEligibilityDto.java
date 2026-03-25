package com.audition.platform.api.dto.me;

/**
 * GET /api/me/applications/{applicationId}/rounds/{roundId}/eligibility
 */
public class MeRoundEligibilityDto {

    private boolean canSubmit;
    private String reason;
    private String submissionStatus;

    public boolean getCanSubmit() {
        return canSubmit;
    }

    public void setCanSubmit(boolean canSubmit) {
        this.canSubmit = canSubmit;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus;
    }
}
