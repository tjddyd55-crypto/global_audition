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

    /** 채널 헤더 한줄 소개 (최대 30자, 줄바꿈 불가). */
    @Size(max = 30)
    private String shortBio;

    /** 채널 상세 소개 (정보 탭). */
    @Size(max = 8000)
    private String bio;

    /** ISO-8601 날짜(yyyy-MM-dd). 빈 문자열이면 삭제. */
    @Size(max = 32)
    private String birthDate;

    /** KR | MN | JP | OTHER. 빈 문자열이면 삭제. */
    @Size(max = 16)
    private String nationality;

    /** {@link #nationality} 와 동일 (API 필드명 country). */
    @Size(max = 16)
    private String country;

    @Size(max = 8000)
    private String introText;

    /** 채널 분야, 최대 3개 (각 항목은 서비스에서 50자까지 정규화). */
    @Size(max = 3, message = "분야는 최대 3개까지입니다.")
    private List<@Size(max = 50) String> categories;

    /** 내 소유 channel_videos.id. 빈 문자열이면 대표 영상 해제. */
    @Size(max = 40)
    private String featuredVideoId;

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

    public String getShortBio() {
        return shortBio;
    }

    public void setShortBio(String shortBio) {
        this.shortBio = shortBio;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    /** nationality 우선, 없으면 country */
    public String resolveNationalityInput() {
        if (nationality != null) {
            return nationality;
        }
        return country;
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
}
