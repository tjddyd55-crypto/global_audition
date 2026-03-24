package com.audition.platform.domain.audition;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audition_rounds")
public class AuditionRound {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audition_id", insertable = false, updatable = false)
    private Audition audition;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(name = "round_name", nullable = false, columnDefinition = "TEXT")
    private String roundName = "";

    @Column(name = "review_method", nullable = false, columnDefinition = "TEXT")
    private String reviewMethod;

    @Column(name = "announcement_title", nullable = false, columnDefinition = "TEXT")
    private String announcementTitle = "";

    @Column(name = "announcement_body", nullable = false, columnDefinition = "TEXT")
    private String announcementBody = "";

    @Column(name = "submission_label", nullable = false, columnDefinition = "TEXT")
    private String submissionLabel = "";

    @Column(name = "submission_guide", nullable = false, columnDefinition = "TEXT")
    private String submissionGuide = "";

    @Column(name = "required_submission_type", nullable = false, columnDefinition = "TEXT")
    private String requiredSubmissionType = "VIDEO";

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "result_announce_at")
    private Instant resultAnnounceAt;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "is_locked", nullable = false)
    private boolean locked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public Audition getAudition() { return audition; }
    public void setAudition(Audition audition) { this.audition = audition; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public String getRoundName() { return roundName; }
    public void setRoundName(String roundName) { this.roundName = roundName; }
    public String getReviewMethod() { return reviewMethod; }
    public void setReviewMethod(String reviewMethod) { this.reviewMethod = reviewMethod; }
    public String getAnnouncementTitle() { return announcementTitle; }
    public void setAnnouncementTitle(String announcementTitle) { this.announcementTitle = announcementTitle; }
    public String getAnnouncementBody() { return announcementBody; }
    public void setAnnouncementBody(String announcementBody) { this.announcementBody = announcementBody; }
    public String getSubmissionLabel() { return submissionLabel; }
    public void setSubmissionLabel(String submissionLabel) { this.submissionLabel = submissionLabel; }
    public String getSubmissionGuide() { return submissionGuide; }
    public void setSubmissionGuide(String submissionGuide) { this.submissionGuide = submissionGuide; }
    public String getRequiredSubmissionType() { return requiredSubmissionType; }
    public void setRequiredSubmissionType(String requiredSubmissionType) { this.requiredSubmissionType = requiredSubmissionType; }
    public Instant getStartAt() { return startAt; }
    public void setStartAt(Instant startAt) { this.startAt = startAt; }
    public Instant getEndAt() { return endAt; }
    public void setEndAt(Instant endAt) { this.endAt = endAt; }
    public Instant getResultAnnounceAt() { return resultAnnounceAt; }
    public void setResultAnnounceAt(Instant resultAnnounceAt) { this.resultAnnounceAt = resultAnnounceAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
