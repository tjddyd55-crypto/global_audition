package com.audition.platform.api.dto.channel;

import java.time.Instant;

/** 공개 채널 영상 상세 (시청자용). */
public class PublicChannelVideoDetailDto {

    private String videoId;
    private String title;
    private String videoUrl;
    private String thumbnailUrl;
    private String description;
    private String category;
    private long viewCount;
    private long likeCount;
    private long dislikeCount;
    private Instant publishedAt;
    private String channelOwnerId;
    private String channelDisplayName;
    private String channelProfileImageUrl;
    private long subscriberCount;
    private boolean subscribed;
    private boolean liked;
    private boolean disliked;

    public String getVideoId() {
        return videoId;
    }

    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public long getDislikeCount() {
        return dislikeCount;
    }

    public void setDislikeCount(long dislikeCount) {
        this.dislikeCount = dislikeCount;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(Instant publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getChannelOwnerId() {
        return channelOwnerId;
    }

    public void setChannelOwnerId(String channelOwnerId) {
        this.channelOwnerId = channelOwnerId;
    }

    public String getChannelDisplayName() {
        return channelDisplayName;
    }

    public void setChannelDisplayName(String channelDisplayName) {
        this.channelDisplayName = channelDisplayName;
    }

    public String getChannelProfileImageUrl() {
        return channelProfileImageUrl;
    }

    public void setChannelProfileImageUrl(String channelProfileImageUrl) {
        this.channelProfileImageUrl = channelProfileImageUrl;
    }

    public long getSubscriberCount() {
        return subscriberCount;
    }

    public void setSubscriberCount(long subscriberCount) {
        this.subscriberCount = subscriberCount;
    }

    public boolean isSubscribed() {
        return subscribed;
    }

    public void setSubscribed(boolean subscribed) {
        this.subscribed = subscribed;
    }

    public boolean isLiked() {
        return liked;
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    public boolean isDisliked() {
        return disliked;
    }

    public void setDisliked(boolean disliked) {
        this.disliked = disliked;
    }
}
