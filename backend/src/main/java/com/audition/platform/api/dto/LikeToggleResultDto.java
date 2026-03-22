package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class LikeToggleResultDto {

    private long likeCount;
    @JsonProperty("isLiked")
    private boolean liked;

    public LikeToggleResultDto() {
    }

    public LikeToggleResultDto(long likeCount, boolean liked) {
        this.likeCount = likeCount;
        this.liked = liked;
    }

    public long getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(long likeCount) {
        this.likeCount = likeCount;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }
}
