package com.audition.platform.api.dto.me;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Size;

import java.util.List;

public class PatchMyChannelRequest {

    @Size(max = 200)
    private String channelName;

    @Size(max = 4000)
    private String channelDescription;

    @JsonAlias("profileImage")
    @Size(max = 2048)
    private String profileImageUrl;

    @Size(max = 2048)
    private String bannerImageUrl;

    /** null 이면 변경 없음 */
    private Boolean isPublic;

    @JsonProperty("is_channel_public")
    private Boolean isChannelPublic;

    /** 화면 채널 이름(닉네임 정책과 동일). 미전송 시 닉네임 미변경 */
    @Size(max = 50)
    private String nickname;

    @Size(max = 4000)
    private String introText;

    /** null 이면 SNS 미변경, 빈 배열이면 전체 삭제 */
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
