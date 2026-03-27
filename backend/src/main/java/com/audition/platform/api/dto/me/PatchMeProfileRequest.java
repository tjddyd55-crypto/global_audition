package com.audition.platform.api.dto.me;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

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

    /** ISO-8601 날짜(yyyy-MM-dd). 빈 문자열이면 삭제. */
    @Size(max = 32)
    private String birthDate;

    /** KR | MN | JP | OTHER. 빈 문자열이면 삭제. */
    @Size(max = 16)
    private String nationality;

    @Size(max = 8000)
    private String introText;

    /**
     * 전송 시 기존 SNS 전체 교체. null 이면 SNS 미변경.
     */
    @Valid
    private List<MeUserSnsLinkDto> snsLinks;

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

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
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
}
