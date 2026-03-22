package com.audition.platform.domain.score;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_scores")
public class ApplicationScore {

    @Id
    @Column(name = "application_id", updatable = false, nullable = false)
    private UUID applicationId;

    @Column(name = "audition_id", nullable = false)
    private UUID auditionId;

    @Column(name = "vote_count", nullable = false)
    private long voteCount = 0;

    @Column(name = "total_view_count", nullable = false)
    private long totalViewCount = 0;

    @Column(name = "like_count", nullable = false)
    private long likeCount = 0;

    @Column(name = "weighted_score", nullable = false)
    private double weightedScore = 0;

    @Column(name = "recommended_rank")
    private Integer recommendedRank;

    @Column(name = "recommended", nullable = false)
    private boolean recommended = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

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

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public long getTotalViewCount() {
        return totalViewCount;
    }

    public void setTotalViewCount(long totalViewCount) {
        this.totalViewCount = totalViewCount;
    }

    public long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(long likeCount) {
        this.likeCount = likeCount;
    }

    public double getWeightedScore() {
        return weightedScore;
    }

    public void setWeightedScore(double weightedScore) {
        this.weightedScore = weightedScore;
    }

    public Integer getRecommendedRank() {
        return recommendedRank;
    }

    public void setRecommendedRank(Integer recommendedRank) {
        this.recommendedRank = recommendedRank;
    }

    public boolean isRecommended() {
        return recommended;
    }

    public void setRecommended(boolean recommended) {
        this.recommended = recommended;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
