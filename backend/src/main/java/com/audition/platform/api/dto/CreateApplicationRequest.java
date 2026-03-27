package com.audition.platform.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CreateApplicationRequest {

    @NotNull
    private UUID auditionId;

    @NotBlank
    @Size(max = 120)
    private String name;

    /** ISO 날짜 YYYY-MM-DD */
    @NotBlank
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$")
    private String birthDate;

    @NotNull
    @Min(0)
    @Max(120)
    private Integer age;

    @NotBlank
    @Size(max = 10)
    private String nationality;

    @NotBlank
    @Size(max = 4000)
    private String videoUrl;

    @NotBlank
    @Size(min = 50, max = 10000)
    private String introText;

    @Valid
    private List<@Valid SnsLinkItem> snsLinks;

    public UUID getAuditionId() {
        return auditionId;
    }

    public void setAuditionId(UUID auditionId) {
        this.auditionId = auditionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getIntroText() {
        return introText;
    }

    public void setIntroText(String introText) {
        this.introText = introText;
    }

    public List<SnsLinkItem> getSnsLinks() {
        return snsLinks;
    }

    public void setSnsLinks(List<SnsLinkItem> snsLinks) {
        this.snsLinks = snsLinks;
    }

    /** Bean validation 이후 서비스에서 null 안전하게 순회 */
    public List<SnsLinkItem> snsLinksOrEmpty() {
        return snsLinks != null ? snsLinks : new ArrayList<>();
    }

    public static class SnsLinkItem {

        @NotBlank
        @Size(max = 32)
        private String platform;

        @NotBlank
        @Size(max = 2000)
        private String url;

        public String getPlatform() {
            return platform;
        }

        public void setPlatform(String platform) {
            this.platform = platform;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }
}
