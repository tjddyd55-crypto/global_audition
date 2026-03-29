package com.audition.platform.api.dto.me;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public class PatchMyChannelRequest {

    @Size(max = 200, message = "채널명은 200자 이하여야 합니다.")
    private String channelName;

    @Size(max = 4000, message = "채널 설명은 4000자 이하여야 합니다.")
    private String channelDescription;

    @JsonAlias("profileImage")
    @Size(max = 2048, message = "프로필 이미지 URL은 2048자 이하여야 합니다.")
    private String profileImageUrl;

    @Size(max = 2048, message = "배너 이미지 URL은 2048자 이하여야 합니다.")
    private String bannerImageUrl;

    /** null 이면 변경 없음 */
    private Boolean isPublic;

    /** JSON: {@code is_channel_public}(권장) 또는 {@code isChannelPublic} */
    @JsonProperty("is_channel_public")
    @JsonAlias({ "isChannelPublic", "channelPublic" })
    private Boolean isChannelPublic;

    /** 화면 채널 이름(닉네임 정책과 동일). 미전송 시 닉네임 미변경 */
    @Size(max = 50, message = "채널 이름(닉네임)은 50자 이하여야 합니다.")
    private String nickname;

    @Size(max = 4000, message = "채널 소개는 4000자 이하여야 합니다.")
    private String introText;

    /** KR | MN | JP | OTHER */
    @Size(max = 16)
    private String nationality;

    @Size(max = 16)
    private String country;

    @Size(max = 100)
    private String bio;

    @Size(max = 3, message = "분야는 최대 3개까지입니다.")
    private List<@Size(max = 50) String> categories;

    @Size(max = 40)
    private String featuredVideoId;

    /** null 이면 SNS 미변경, 빈 배열이면 전체 삭제 */
    @Valid
    private List<MeUserSnsLinkDto> snsLinks;

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

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public Boolean getIsChannelPublic() {
        return isChannelPublic;
    }

    public void setIsChannelPublic(Boolean channelPublic) {
        this.isChannelPublic = channelPublic;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String resolveNationalityInput() {
        if (nationality != null) {
            return nationality;
        }
        return country;
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
        this.categories = categories;
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
        this.snsLinks = snsLinks;
    }

    /** {@code is_channel_public} 우선, 없으면 레거시 {@code isPublic} */
    public Boolean resolveChannelPublic() {
        if (isChannelPublic != null) {
            return isChannelPublic;
        }
        return isPublic;
    }
}
