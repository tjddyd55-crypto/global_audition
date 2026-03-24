package com.audition.platform.domain.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "votes")
public class Vote {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    /** NULL: 레거시 오디션당 1표. 설정 시 해당 라운드당 1표 */
    @Column(name = "round_id")
    private UUID roundId;

    @Column(name = "application_round_submission_id")
    private UUID applicationRoundSubmissionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public UUID getAuditionId() {
        return auditionId;
    }

    public void setAuditionId(UUID auditionId) {
        this.auditionId = auditionId;
    }

    public UUID getRoundId() {
        return roundId;
    }

    public void setRoundId(UUID roundId) {
        this.roundId = roundId;
    }

    public UUID getApplicationRoundSubmissionId() {
        return applicationRoundSubmissionId;
    }

    public void setApplicationRoundSubmissionId(UUID applicationRoundSubmissionId) {
        this.applicationRoundSubmissionId = applicationRoundSubmissionId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
