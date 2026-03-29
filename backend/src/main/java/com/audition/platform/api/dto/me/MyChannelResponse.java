package com.audition.platform.api.dto.me;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/** GET/PATCH /api/me/channel — 채널(프로필+공개 설정) + 집계 */
public class MyChannelResponse {

    private String channelId;
    private String channelName;
    private String channelDescription;
    private String profileImageUrl;
    private String bannerImageUrl;
    private long videoCount;
    private long subscriberCount;
    private long viewCount;

    private boolean channelPublic;

    /** 화면 표시용 닉네임(채널 이름과 동기화) */
    private String nickname;
    private String introText;
    private String nationality;
    private String bio;
    private List<String> categories = new ArrayList<>();
    private String featuredVideoId;
    private List<MeUserSnsLinkDto> snsLinks = new ArrayList<>();

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

    @JsonProperty("isPublic")
    public boolean isChannelPublic() {
        return channelPublic;
    }

    @JsonProperty("isPublic")
    public void setChannelPublic(boolean channelPublic) {
        this.channelPublic = channelPublic;
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

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    @JsonProperty("country")
    public String getCountry() {
        return nationality;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }

    public String getFeaturedVideoId() {
        return featuredVideoId;
    }

    public void setFeaturedVideoId(String featuredVideoId) {
        this.featuredVideoId = featuredVideoId;
    }

    public List<MeUserSnsLinkDto> getSnsLinks() {
        return snsLinks;
    }

    public void setSnsLinks(List<MeUserSnsLinkDto> snsLinks) {
        this.snsLinks = snsLinks != null ? snsLinks : new ArrayList<>();
    }

    /** API 필드명 {@code profileImage} — {@link #profileImageUrl}과 동일 값 */
    @JsonProperty("profileImage")
    public String getProfileImage() {
        return profileImageUrl;
    }

    @JsonProperty("is_channel_public")
    public boolean getIsChannelPublicField() {
        return channelPublic;
    }
}
