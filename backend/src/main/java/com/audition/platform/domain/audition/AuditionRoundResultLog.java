package com.audition.platform.domain.audition;

import com.audition.platform.domain.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audition_round_result_logs")
public class AuditionRoundResultLog {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", insertable = false, updatable = false)
    private Application application;

    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", insertable = false, updatable = false)
    private AuditionRound round;

    @Column(name = "previous_status", columnDefinition = "TEXT")
    private String previousStatus;

    @Column(name = "next_status", columnDefinition = "TEXT")
    private String nextStatus;

    @Column(name = "changed_by_user_id")
    private UUID changedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_user_id", insertable = false, updatable = false)
    private User changedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
    public UUID getRoundId() { return roundId; }
    public void setRoundId(UUID roundId) { this.roundId = roundId; }
    public AuditionRound getRound() { return round; }
    public void setRound(AuditionRound round) { this.round = round; }
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public String getNextStatus() { return nextStatus; }
    public void setNextStatus(String nextStatus) { this.nextStatus = nextStatus; }
    public UUID getChangedByUserId() { return changedByUserId; }
    public void setChangedByUserId(UUID changedByUserId) { this.changedByUserId = changedByUserId; }
    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
