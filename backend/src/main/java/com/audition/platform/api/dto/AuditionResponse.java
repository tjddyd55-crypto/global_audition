package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class AuditionResponse {

    private UUID id;
    private UUID ownerId;
    private String title;
    private String description;
    private String status;
    private Instant updatedAt;
    private String countryCode;
    private Instant deadlineAt;
    private String category;
    private Instant createdAt;

    private String coverImage;
    private String videoUrl;
    private String[] galleryImages;
    private String agencyName;
    private String agencyLogo;
    private int applicantsCount;
    private int remainingDays;
    private String[] recruitFields;
    private String[] qualifications;
    private String[] schedules;
    private String location;
    private Instant startDate;
    private Instant endDate;
    private String[] benefits;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public Instant getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(Instant deadlineAt) { this.deadlineAt = deadlineAt; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String[] getGalleryImages() { return galleryImages; }
    public void setGalleryImages(String[] galleryImages) { this.galleryImages = galleryImages; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getAgencyLogo() { return agencyLogo; }
    public void setAgencyLogo(String agencyLogo) { this.agencyLogo = agencyLogo; }
    public int getApplicantsCount() { return applicantsCount; }
    public void setApplicantsCount(int applicantsCount) { this.applicantsCount = applicantsCount; }
    public int getRemainingDays() { return remainingDays; }
    public void setRemainingDays(int remainingDays) { this.remainingDays = remainingDays; }
    public String[] getRecruitFields() { return recruitFields; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields; }
    public String[] getQualifications() { return qualifications; }
    public void setQualifications(String[] qualifications) { this.qualifications = qualifications; }
    public String[] getSchedules() { return schedules; }
    public void setSchedules(String[] schedules) { this.schedules = schedules; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public String[] getBenefits() { return benefits; }
    public void setBenefits(String[] benefits) { this.benefits = benefits; }
}
