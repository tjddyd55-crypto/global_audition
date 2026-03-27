package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ApplicationResponse {

    private UUID id;
    private UUID auditionId;
    private UUID applicantId;
    private String applicantEmail;
    private String status;
    private String message;
    private Instant updatedAt;
    private Instant createdAt;
    private String auditionTitle; // for "my applications" list

    /** 지원서 표시 이름 (상세·GET /applications/:id 등) */
    private String name;
    /** yyyy-MM-dd */
    private String birthDate;
    private Integer age;
    private String nationality;
    private String introText;
    /** 대표 영상 (영상 목록 첫 항목 우선) */
    private String videoUrl;
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ApplicationSnsLinkItem> snsLinks;

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ApplicationVideoItem> videos;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditionId() { return auditionId; }
    public void setAuditionId(UUID auditionId) { this.auditionId = auditionId; }
    public UUID getApplicantId() { return applicantId; }
    public void setApplicantId(UUID applicantId) { this.applicantId = applicantId; }
    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getAuditionTitle() { return auditionTitle; }
    public void setAuditionTitle(String auditionTitle) { this.auditionTitle = auditionTitle; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBirthDate() { return birthDate; }
    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getIntroText() { return introText; }
    public void setIntroText(String introText) { this.introText = introText; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public List<ApplicationSnsLinkItem> getSnsLinks() { return snsLinks; }
    public void setSnsLinks(List<ApplicationSnsLinkItem> snsLinks) {
        this.snsLinks = snsLinks;
    }

    public List<ApplicationVideoItem> getVideos() { return videos; }
    public void setVideos(List<ApplicationVideoItem> videos) {
        this.videos = videos;
    }
}
