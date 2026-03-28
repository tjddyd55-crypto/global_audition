package com.audition.platform.api.dto.channel;

import com.audition.platform.api.dto.me.MeUserSnsLinkDto;
import com.audition.platform.api.dto.me.MyChannelVideoDto;

import java.util.ArrayList;
import java.util.List;

/** GET /api/channels/{userId} — 공개 채널(사용자·채널 메타 + 공개 영상만) */
public class PublicChannelResponse {

    private String userId;
    private String displayName;
    /** 실명 등(선택). 공개 프로필에만 포함 */
    private String name;
    private String nickname;
    /** /me 프로필 자기소개 */
    private String introText;
    private String channelId;
    private String channelName;
    private String channelDescription;
    /** 우선 사용자 프로필 이미지, 없으면 채널 이미지 */
    private String profileImageUrl;
    private String bannerImageUrl;
    /** 공개 영상 수 */
    private long videoCount;
    private long subscriberCount;
    /** 공개 영상 조회수 합 */
    private long viewCount;
    private List<MyChannelVideoDto> videos = new ArrayList<>();
    private List<MeUserSnsLinkDto> snsLinks = new ArrayList<>();

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getIntroText() {
        return introText;
    }

    public void setIntroText(String introText) {
        this.introText = introText;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }

    public String getChannelName() {
        return channelName;
    }

    public void setChannelName(String channelName) {
        this.channelName = channelName;
    }

    public String getChannelDescription() {
        return channelDescription;
    }

    public void setChannelDescription(String channelDescription) {
        this.channelDescription = channelDescription;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getBannerImageUrl() {
        return bannerImageUrl;
    }

    public void setBannerImageUrl(String bannerImageUrl) {
        this.bannerImageUrl = bannerImageUrl;
    }

    public long getVideoCount() {
        return videoCount;
    }

    public void setVideoCount(long videoCount) {
        this.videoCount = videoCount;
    }

    public long getSubscriberCount() {
        return subscriberCount;
    }

    public void setSubscriberCount(long subscriberCount) {
        this.subscriberCount = subscriberCount;
    }

    public long getViewCount() {
        return viewCount;
    }

    public void setViewCount(long viewCount) {
        this.viewCount = viewCount;
    }

    public List<MyChannelVideoDto> getVideos() {
        return videos;
    }

    public void setVideos(List<MyChannelVideoDto> videos) {
        this.videos = videos != null ? videos : new ArrayList<>();
    }

    public List<MeUserSnsLinkDto> getSnsLinks() {
        return snsLinks;
    }

    public void setSnsLinks(List<MeUserSnsLinkDto> snsLinks) {
        this.snsLinks = snsLinks != null ? snsLinks : new ArrayList<>();
    }
}
