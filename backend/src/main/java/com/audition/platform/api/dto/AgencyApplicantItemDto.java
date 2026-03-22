package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 기획사 지원자 관리 카드 (GET /api/auditions/{id}/applications/manage)
 */
public class AgencyApplicantItemDto {

    private String applicationId;
    private String userName;
    private String userEmail;
    private String videoUrl;
    private String thumbnailUrl;
    private String category;
    private long viewCount;
    private long likeCount;
    private long voteCount;
    private Double recommendedScore;
    private Integer recommendedRank;
    /** 랭킹 순위 (recommendedRank 와 동일 스냅샷) */
    private Integer rank;
    /** SUBMITTED | REVIEWING | ACCEPTED | REJECTED */
    private String status;
    private Boolean recommended;
    /** 관리 화면에서는 항상 false (투표 카드와 필드 스키마 통일) */
    private boolean voted;

    @JsonProperty("isVoted")
    public boolean isVoted() {
        return voted;
    }

    public void setVoted(boolean voted) {
        this.voted = voted;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getViewCount() {
        return viewCount;
    }

    public void setViewCount(long viewCount) {
        this.viewCount = viewCount;
    }

    public long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(long likeCount) {
        this.likeCount = likeCount;
    }

    public long getVoteCount() {
        return voteCount;
    }

    public void setVoteCount(long voteCount) {
        this.voteCount = voteCount;
    }

    public Double getRecommendedScore() {
        return recommendedScore;
    }

    public void setRecommendedScore(Double recommendedScore) {
        this.recommendedScore = recommendedScore;
    }

    public Integer getRecommendedRank() {
        return recommendedRank;
    }

    public void setRecommendedRank(Integer recommendedRank) {
        this.recommendedRank = recommendedRank;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getRecommended() {
        return recommended;
    }

    public void setRecommended(Boolean recommended) {
        this.recommended = recommended;
    }
}
