package com.audition.platform.domain.audition;

import com.audition.platform.domain.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audition_id", insertable = false, updatable = false)
    private Audition audition;

    @Column(name = "applicant_id", nullable = false)
    private UUID applicantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", insertable = false, updatable = false)
    private User applicant;

    /** 심사 파이프라인: SUBMITTING 완료 후 SUBMITTED → REVIEWING → ACCEPTED | REJECTED (투표와 무관) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String status;

    /** 공개 투표 누적 수 — votes 테이블과 트랜잭션으로 동기화, 목록 조회 시 COUNT(*) 사용 금지 */
    @Column(name = "vote_count", nullable = false)
    private long voteCount = 0;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "current_round_number", nullable = false)
    private int currentRoundNumber = 1;

    @Column(name = "final_status", nullable = false, columnDefinition = "TEXT")
    private String finalStatus = "IN_PROGRESS";

    @Column(name = "latest_result_status", nullable = false, columnDefinition = "TEXT")
    private String latestResultStatus = "PENDING";

    @Column(name = "latest_round_submission_id")
    private UUID latestRoundSubmissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "latest_round_submission_id", insertable = false, updatable = false)
    private ApplicationRoundSubmission latestRoundSubmission;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public Audition getAudition() { return audition; }
    public void setAudition(Audition audition) { this.audition = audition; }
    public UUID getApplicantId() { return applicantId; }
    public void setApplicantId(UUID applicantId) { this.applicantId = applicantId; }
    public User getApplicant() { return applicant; }
    public void setApplicant(User applicant) { this.applicant = applicant; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public long getVoteCount() { return voteCount; }
    public void setVoteCount(long voteCount) { this.voteCount = voteCount; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public int getCurrentRoundNumber() { return currentRoundNumber; }
    public void setCurrentRoundNumber(int currentRoundNumber) { this.currentRoundNumber = currentRoundNumber; }
    public String getFinalStatus() { return finalStatus; }
    public void setFinalStatus(String finalStatus) { this.finalStatus = finalStatus; }
    public String getLatestResultStatus() { return latestResultStatus; }
    public void setLatestResultStatus(String latestResultStatus) { this.latestResultStatus = latestResultStatus; }
    public UUID getLatestRoundSubmissionId() { return latestRoundSubmissionId; }
    public void setLatestRoundSubmissionId(UUID latestRoundSubmissionId) { this.latestRoundSubmissionId = latestRoundSubmissionId; }
    public ApplicationRoundSubmission getLatestRoundSubmission() { return latestRoundSubmission; }
    public void setLatestRoundSubmission(ApplicationRoundSubmission latestRoundSubmission) { this.latestRoundSubmission = latestRoundSubmission; }
}
