package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Size;

public class PatchMyChannelRequest {

    @Size(max = 200)
    private String channelName;

    @Size(max = 4000)
    private String channelDescription;

    @Size(max = 2048)
    private String profileImageUrl;

    @Size(max = 2048)
    private String bannerImageUrl;

    /** null 이면 변경 없음 */
    private Boolean isPublic;

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
}
