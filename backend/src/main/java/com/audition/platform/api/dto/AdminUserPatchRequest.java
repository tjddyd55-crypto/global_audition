package com.audition.platform.api.dto;

import jakarta.validation.constraints.Size;

public class AdminUserPatchRequest {

    @Size(min = 2, max = 20)
    private String nickname;

    @Size(max = 120)
    private String name;

    @Size(max = 2048)
    private String profileImageUrl;

    @Size(max = 2000)
    private String bio;

    private String countryCode;

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}
