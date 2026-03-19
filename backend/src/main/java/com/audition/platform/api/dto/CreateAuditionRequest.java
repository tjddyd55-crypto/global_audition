package com.audition.platform.api.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * POST /api/auditions — 필드명·구조는 Prisma Audition / 프론트 폼과 동일
 */
public class CreateAuditionRequest {

    @NotBlank
    @Size(min = 1, max = 200)
    private String title;

    @NotBlank
    @Size(max = 10000)
    private String description;

    @Pattern(regexp = "DRAFT|OPEN|CLOSED")
    private String status = "DRAFT";

    @NotBlank
    @Size(max = 120)
    private String category;

    @Size(max = 2000)
    private String coverImage;

    @Size(max = 2000)
    private String videoUrl;

    private List<String> galleryImages;

    @NotBlank
    @Size(max = 200)
    private String agencyName;

    @Size(max = 2000)
    private String agencyLogo;

    private List<String> recruitFields;

    @NotBlank
    @Size(max = 500)
    private String location;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    /** recruit, qualification, schedule, benefits 배열 */
    private JsonNode detailContent;

    private List<String> benefits;

    private String countryCode;
    private String deadlineAt;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public List<String> getGalleryImages() { return galleryImages; }
    public void setGalleryImages(List<String> galleryImages) { this.galleryImages = galleryImages; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public String getAgencyLogo() { return agencyLogo; }
    public void setAgencyLogo(String agencyLogo) { this.agencyLogo = agencyLogo; }
    public List<String> getRecruitFields() { return recruitFields; }
    public void setRecruitFields(List<String> recruitFields) { this.recruitFields = recruitFields; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public JsonNode getDetailContent() { return detailContent; }
    public void setDetailContent(JsonNode detailContent) { this.detailContent = detailContent; }
    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) { this.benefits = benefits; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(String deadlineAt) { this.deadlineAt = deadlineAt; }
}
