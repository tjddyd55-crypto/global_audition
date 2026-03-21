package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Size;

public class PatchMeProfileRequest {

    @Size(max = 120)
    private String displayName;

    @Size(max = 2048)
    private String profileImageUrl;

    @Size(max = 2000)
    private String bio;

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
}
