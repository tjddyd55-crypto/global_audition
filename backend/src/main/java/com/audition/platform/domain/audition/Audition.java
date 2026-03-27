package com.audition.platform.domain.audition;

import com.audition.platform.domain.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * SSOT: Flyway auditions · API DTO · Prisma · frontend types 와 컬럼/배열 필드 일치.
 * text[] — recruit_fields, qualifications, schedules, benefits, gallery_images. 태그는 audition_tags·tags 테이블.
 */
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

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    /** 레거시·동기화: 항상 {@link #imageOriginalUrl} 과 동일하게 유지 */
    @Column(name = "cover_image", columnDefinition = "TEXT")
    private String coverImage;

    @Column(name = "image_original_url", columnDefinition = "TEXT")
    private String imageOriginalUrl;

    @Column(name = "image_medium_url", columnDefinition = "TEXT")
    private String imageMediumUrl;

    @Column(name = "image_thumb_url", columnDefinition = "TEXT")
    private String imageThumbUrl;

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

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "qualifications", columnDefinition = "text[]")
    private String[] qualifications = new String[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "schedules", columnDefinition = "text[]")
    private String[] schedules = new String[0];

    @Column(nullable = false, columnDefinition = "TEXT")
    private String location = "";

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "benefits", columnDefinition = "text[]")
    private String[] benefits = new String[0];

    /** SINGLE: 기존 단일 지원 흐름. MULTI_ROUND: audition_rounds 사용 */
    @Column(name = "process_mode", nullable = false, columnDefinition = "TEXT")
    private String processMode = "SINGLE";

    @Column(name = "current_round_number")
    private Integer currentRoundNumber;

    @Column(name = "max_round_number")
    private Integer maxRoundNumber;

    @Column(name = "selection_status", columnDefinition = "TEXT")
    private String selectionStatus;

    /** 동일 시리즈(예: 1차·2차 공고)를 묶는 id. 최초 공고는 보통 group_id = id. */
    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    /** 시리즈 내 차수(1차=1, 2차=2). audition_rounds의 round_number 와 무관. */
    @Column(name = "series_round", nullable = false)
    private int seriesRound = 1;

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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getImageOriginalUrl() { return imageOriginalUrl; }
    public void setImageOriginalUrl(String imageOriginalUrl) { this.imageOriginalUrl = imageOriginalUrl; }
    public String getImageMediumUrl() { return imageMediumUrl; }
    public void setImageMediumUrl(String imageMediumUrl) { this.imageMediumUrl = imageMediumUrl; }
    public String getImageThumbUrl() { return imageThumbUrl; }
    public void setImageThumbUrl(String imageThumbUrl) { this.imageThumbUrl = imageThumbUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    /** DB/Hibernate가 null을 줄 수 있어도 호출부에는 빈 배열만 노출 (API null 금지) */
    public String[] getGalleryImages() { return galleryImages != null ? galleryImages : new String[0]; }
    public void setGalleryImages(String[] galleryImages) { this.galleryImages = galleryImages != null ? galleryImages : new String[0]; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getAgencyLogo() { return agencyLogo; }
    public void setAgencyLogo(String agencyLogo) { this.agencyLogo = agencyLogo; }
    public int getApplicantsCount() { return applicantsCount; }
    public void setApplicantsCount(int applicantsCount) { this.applicantsCount = applicantsCount; }
    public int getRemainingDays() { return remainingDays; }
    public void setRemainingDays(int remainingDays) { this.remainingDays = remainingDays; }
    public String[] getRecruitFields() { return recruitFields != null ? recruitFields : new String[0]; }
    public void setRecruitFields(String[] recruitFields) { this.recruitFields = recruitFields != null ? recruitFields : new String[0]; }
    public String[] getQualifications() { return qualifications != null ? qualifications : new String[0]; }
    public void setQualifications(String[] qualifications) { this.qualifications = qualifications != null ? qualifications : new String[0]; }
    public String[] getSchedules() { return schedules != null ? schedules : new String[0]; }
    public void setSchedules(String[] schedules) { this.schedules = schedules != null ? schedules : new String[0]; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Instant getStartDate() { return startDate; }
    public void setStartDate(Instant startDate) { this.startDate = startDate; }
    public Instant getEndDate() { return endDate; }
    public void setEndDate(Instant endDate) { this.endDate = endDate; }
    public String[] getBenefits() { return benefits != null ? benefits : new String[0]; }
    public void setBenefits(String[] benefits) { this.benefits = benefits != null ? benefits : new String[0]; }
    public String getProcessMode() { return processMode; }
    public void setProcessMode(String processMode) { this.processMode = processMode != null ? processMode : "SINGLE"; }
    public Integer getCurrentRoundNumber() { return currentRoundNumber; }
    public void setCurrentRoundNumber(Integer currentRoundNumber) { this.currentRoundNumber = currentRoundNumber; }
    public Integer getMaxRoundNumber() { return maxRoundNumber; }
    public void setMaxRoundNumber(Integer maxRoundNumber) { this.maxRoundNumber = maxRoundNumber; }
    public String getSelectionStatus() { return selectionStatus; }
    public void setSelectionStatus(String selectionStatus) { this.selectionStatus = selectionStatus; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public int getSeriesRound() { return seriesRound; }
    public void setSeriesRound(int seriesRound) { this.seriesRound = seriesRound; }
}
