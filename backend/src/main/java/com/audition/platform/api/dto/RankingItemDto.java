package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 회차 랭킹 항목. 공개 응답은 applicationId·userName·avatarUrl·voteCount·rank·isVoted 만 채운다.
 * category·viewCount·status·score·recommended 는 공고 소유 기획사·관리자 응답에서만 채워지고, 그 외에는 null 이라 직렬화되지 않는다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RankingItemDto {

    private String applicationId;
    private String userName;
    /** 공개 프로필 이미지(없으면 null) */
    private String avatarUrl;
    private String category;
    /** 현재 회차 득표 */
    private long voteCount;
    private Long viewCount;
    private String status;
    private Double score;
    private int rank;
    private Boolean recommended;

    /** 랭킹 API에서도 투표 카드와 동일 필드명 제공(현재 회차 내 표) */
    private boolean voted;

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public long getVoteCount() { return voteCount; }
    public void setVoteCount(long voteCount) { this.voteCount = voteCount; }
    public Long getViewCount() { return viewCount; }
    public void setViewCount(Long viewCount) { this.viewCount = viewCount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    @JsonProperty("recommended")
    public Boolean getRecommended() { return recommended; }
    public void setRecommended(Boolean recommended) { this.recommended = recommended; }

    @JsonProperty("isVoted")
    public boolean isVoted() { return voted; }
    public void setVoted(boolean voted) { this.voted = voted; }
}
