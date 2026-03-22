package com.audition.platform.api.dto;

/**
 * 기획사 지원자 관리 카드 (GET /api/auditions/{id}/applications)
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
    /** SUBMITTED | REVIEWING | ACCEPTED | REJECTED */
    private String status;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
