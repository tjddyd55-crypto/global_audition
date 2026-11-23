package com.audition.platform.api.dto.saves;

import java.time.Instant;
import java.util.UUID;

public class AuditionSaveItemResponse {

    private UUID auditionId;
    private Instant savedAt;
    private boolean available;
    private String recruitmentStatus;
    private String title;
    private String agencyName;
    private String coverImage;
    private String countryCode;
    private String hostCountry;
    private String[] recruitFields = new String[0];
    private Instant deadlineAt;
    private Instant startDate;
    private Instant endDate;

    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public Instant getSavedAt() { return savedAt; }
    public void setSavedAt(Instant savedAt) { this.savedAt = savedAt; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public String getRecruitmentStatus() { return recruitmentStatus; }
    public void setRecruitmentStatus(String recruitmentStatus) { this.recruitmentStatus = recruitmentStatus; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getHostCountry() { return hostCountry; }
    public void setHostCountry(String hostCountry) { this.hostCountry = hostCountry; }
    public String[] getRecruitFields() { return recruitFields != null ? recruitFields : new String[0]; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields != null ? recruitFields : new String[0]; }
    public Instant getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(Instant deadlineAt) { this.deadlineAt = deadlineAt; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
}
