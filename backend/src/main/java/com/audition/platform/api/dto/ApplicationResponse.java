package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class ApplicationResponse {

    private UUID id;
    private UUID auditionId;
    private UUID applicantId;
    private String applicantEmail;
    private String status;
    private Instant createdAt;
    private String auditionTitle; // for "my applications" list

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public UUID getApplicantId() { return applicantId; }
    public void setApplicantId(UUID applicantId) { this.applicantId = applicantId; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getAuditionTitle() { return auditionTitle; }
    public void setAuditionTitle(String auditionTitle) { this.auditionTitle = auditionTitle; }
}
