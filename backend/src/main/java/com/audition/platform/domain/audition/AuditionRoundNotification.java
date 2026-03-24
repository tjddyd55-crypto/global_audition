package com.audition.platform.domain.audition;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audition_round_notifications")
public class AuditionRoundNotification {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

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

    @Column(name = "application_id")
    private UUID applicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", insertable = false, updatable = false)
    private Application application;

    @Column(name = "notification_type", nullable = false, columnDefinition = "TEXT")
    private String notificationType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String channel;

    @Column(name = "target_email", columnDefinition = "TEXT")
    private String targetEmail;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String status = "PENDING";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "jsonb")
    private Map<String, Object> payloadJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public Audition getAudition() { return audition; }
    public void setAudition(Audition audition) { this.audition = audition; }
    public UUID getRoundId() { return roundId; }
    public void setRoundId(UUID roundId) { this.roundId = roundId; }
    public AuditionRound getRound() { return round; }
    public void setRound(AuditionRound round) { this.round = round; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getTargetEmail() { return targetEmail; }
    public void setTargetEmail(String targetEmail) { this.targetEmail = targetEmail; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getPayloadJson() { return payloadJson; }
    public void setPayloadJson(Map<String, Object> payloadJson) { this.payloadJson = payloadJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
