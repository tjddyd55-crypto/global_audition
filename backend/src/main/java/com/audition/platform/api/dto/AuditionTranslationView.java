package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class AuditionTranslationView {

    private UUID auditionId;
    private String locale;
    private String title;
    private String description;
    private String location;
    private String agencyName;
    private String[] recruitFields;
    private String[] qualifications;
    private String[] schedules;
    private String[] benefits;
    private String status;
    private String provider;
    private String errorCode;
    private String errorMessage;
    private String sourceHash;
    private Long sourceRevision;
    private String origin;
    private boolean manuallyEdited;
    private boolean stale;
    private Instant updatedAt;

    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String[] getRecruitFields() { return recruitFields; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields; }
    public String[] getQualifications() { return qualifications; }
    public void setQualifications(String[] qualifications) { this.qualifications = qualifications; }
    public String[] getSchedules() { return schedules; }
    public void setSchedules(String[] schedules) { this.schedules = schedules; }
    public String[] getBenefits() { return benefits; }
    public void setBenefits(String[] benefits) { this.benefits = benefits; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public String getSourceHash() { return sourceHash; }
    public void setSourceHash(String sourceHash) { this.sourceHash = sourceHash; }
    public Long getSourceRevision() { return sourceRevision; }
    public void setSourceRevision(Long sourceRevision) { this.sourceRevision = sourceRevision; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public boolean isManuallyEdited() { return manuallyEdited; }
    public void setManuallyEdited(boolean manuallyEdited) { this.manuallyEdited = manuallyEdited; }
    public boolean isStale() { return stale; }
    public void setStale(boolean stale) { this.stale = stale; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
