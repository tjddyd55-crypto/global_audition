package com.audition.platform.api.dto.admin;

import java.time.Instant;
import java.util.UUID;

public class AdminRoundApplicationRowDto {

    private UUID applicationId;
    private UUID roundSubmissionId;
    private String applicantEmail;
    private String applicantDisplayName;
    private int applicationCurrentRoundNumber;
    private String finalStatus;
    private String latestResultStatus;
    private String submissionStatus;
    private Instant submittedAt;

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public UUID getRoundSubmissionId() {
        return roundSubmissionId;
    }

    public void setRoundSubmissionId(UUID roundSubmissionId) {
        this.roundSubmissionId = roundSubmissionId;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public void setApplicantEmail(String applicantEmail) {
        this.applicantEmail = applicantEmail;
    }

    public String getApplicantDisplayName() {
        return applicantDisplayName;
    }

    public void setApplicantDisplayName(String applicantDisplayName) {
        this.applicantDisplayName = applicantDisplayName;
    }

    public int getApplicationCurrentRoundNumber() {
        return applicationCurrentRoundNumber;
    }

    public void setApplicationCurrentRoundNumber(int applicationCurrentRoundNumber) {
        this.applicationCurrentRoundNumber = applicationCurrentRoundNumber;
    }

    public String getFinalStatus() {
        return finalStatus;
    }

    public void setFinalStatus(String finalStatus) {
        this.finalStatus = finalStatus;
    }

    public String getLatestResultStatus() {
        return latestResultStatus;
    }

    public void setLatestResultStatus(String latestResultStatus) {
        this.latestResultStatus = latestResultStatus;
    }

    public String getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(String submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }
}
