package com.audition.platform.api.dto.me;

import jakarta.validation.constraints.Size;

public class PatchMeProfileRequest {

    /** 변경 시에만 전송. 형식·중복은 서비스에서 {@link com.audition.platform.domain.user.NicknamePolicy} 로 검증. */
    @Size(min = 2, max = 20)
    private String nickname;

    @Size(max = 120)
    private String name;

    @Size(max = 2048)
    private String profileImageUrl;

    @Size(max = 2000)
    private String bio;

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
