package com.audition.platform.domain.vote;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "audition_vote_candidates")
@IdClass(AuditionVoteCandidate.PK.class)
public class AuditionVoteCandidate {

    @Id
    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @Id
    @Column(name = "round_number", nullable = false)
    private int roundNumber;

    @Id
    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "candidate_number", nullable = false)
    private int candidateNumber;

    public int getCandidateNumber() { return candidateNumber; }
    public void setCandidateNumber(int candidateNumber) { this.candidateNumber = candidateNumber; }

    @Column(name = "confirmed_at", nullable = false)
    private Instant confirmedAt = Instant.now();

    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public static class PK implements Serializable {
        private UUID auditionId;
        private int roundNumber;
        private UUID applicationId;

        public PK() {}

        public PK(UUID auditionId, int roundNumber, UUID applicationId) {
            this.auditionId = auditionId;
            this.roundNumber = roundNumber;
            this.applicationId = applicationId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return roundNumber == pk.roundNumber
                    && Objects.equals(auditionId, pk.auditionId)
                    && Objects.equals(applicationId, pk.applicationId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(auditionId, roundNumber, applicationId);
        }
    }
}
