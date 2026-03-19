package com.audition.platform.domain.audition;

import com.audition.platform.domain.user.User;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auditions")
public class Audition {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    private User owner;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String status;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "country_code", columnDefinition = "TEXT")
    private String countryCode;

    @Column(name = "deadline_at")
    private Instant deadlineAt;

    @Column(columnDefinition = "TEXT")
    private String category = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "cover_image", columnDefinition = "TEXT")
    private String coverImage;

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "gallery_images", columnDefinition = "text[]")
    private String[] galleryImages = new String[0];

    @Column(name = "agency_name", nullable = false, columnDefinition = "TEXT")
    private String agencyName = "";

    @Column(name = "agency_logo", columnDefinition = "TEXT")
    private String agencyLogo;

    @Column(name = "applicants_count", nullable = false)
    private int applicantsCount = 0;

    @Column(name = "remaining_days", nullable = false)
    private int remainingDays = 0;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "recruit_fields", columnDefinition = "text[]")
    private String[] recruitFields = new String[0];

    @Column(nullable = false, columnDefinition = "TEXT")
    private String location = "";

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail_content", nullable = false, columnDefinition = "jsonb")
    private JsonNode detailContent;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "benefits", columnDefinition = "text[]")
    private String[] benefits = new String[0];

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
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
    public void setCoverImage(String coverImage) { return coverImage; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { return videoUrl; }
    public String[] getGalleryImages() { return galleryImages; }
    public void setGalleryImages(String[] galleryImages) { this.galleryImages = galleryImages != null ? galleryImages : new String[0]; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getAgencyLogo() { return agencyLogo; }
    public void setAgencyLogo(String agencyLogo) { this.agencyLogo = agencyLogo; }
    public int getApplicantsCount() { return applicantsCount; }
    public void setApplicantsCount(int applicantsCount) { this.applicantsCount = applicantsCount; }
    public int getRemainingDays() { return remainingDays; }
    public void setRemainingDays(int remainingDays) { this.remainingDays = remainingDays; }
    public String[] getRecruitFields() { return recruitFields; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields != null ? recruitFields : new String[0]; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public JsonNode getDetailContent() { return detailContent; }
    public void setDetailContent(JsonNode detailContent) { this.detailContent = detailContent; }
    public String[] getBenefits() { return benefits; }
    public void setBenefits(String[] benefits) { this.benefits = benefits != null ? benefits : new String[0]; }
}
