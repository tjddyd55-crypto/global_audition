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

    @Column(nullable = false, columnDefinition = "TEXT") // SUBMITTED | REVIEWED | ACCEPTED | REJECTED
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
