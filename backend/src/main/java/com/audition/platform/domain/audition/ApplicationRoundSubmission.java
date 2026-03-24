package com.audition.platform.domain.audition;

import com.audition.platform.domain.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_round_submissions")
public class ApplicationRoundSubmission {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", insertable = false, updatable = false)
    private Application application;

    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audition_id", insertable = false, updatable = false)
    private Audition audition;

    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", insertable = false, updatable = false)
    private AuditionRound round;

    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Column(name = "submission_status", nullable = false, columnDefinition = "TEXT")
    private String submissionStatus = "NOT_SUBMITTED";

    @Column(name = "video_url", columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "file_url", columnDefinition = "TEXT")
    private String fileUrl;

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "reviewer_user_id")
    private UUID reviewerUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_user_id", insertable = false, updatable = false)
    private User reviewer;

    @Column(name = "reviewer_note", columnDefinition = "TEXT")
    private String reviewerNote;

    private Double score;

    @Column(name = "rank_order")
    private Integer rankOrder;

    @Column(name = "vote_count", nullable = false)
    private long voteCount;

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
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public Audition getAudition() { return audition; }
    public void setAudition(Audition audition) { this.audition = audition; }
    public UUID getRoundId() { return roundId; }
    public void setRoundId(UUID roundId) { this.roundId = roundId; }
    public AuditionRound getRound() { return round; }
    public void setRound(AuditionRound round) { this.round = round; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public String getSubmissionStatus() { return submissionStatus; }
    public void setSubmissionStatus(String submissionStatus) { this.submissionStatus = submissionStatus; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getTextAnswer() { return textAnswer; }
    public void setTextAnswer(String textAnswer) { this.textAnswer = textAnswer; }
    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public UUID getReviewerUserId() { return reviewerUserId; }
    public void setReviewerUserId(UUID reviewerUserId) { this.reviewerUserId = reviewerUserId; }
    public User getReviewer() { return reviewer; }
    public void setReviewer(User reviewer) { this.reviewer = reviewer; }
    public String getReviewerNote() { return reviewerNote; }
    public void setReviewerNote(String reviewerNote) { this.reviewerNote = reviewerNote; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public Integer getRankOrder() { return rankOrder; }
    public void setRankOrder(Integer rankOrder) { this.rankOrder = rankOrder; }
    public long getVoteCount() { return voteCount; }
    public void setVoteCount(long voteCount) { this.voteCount = voteCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
