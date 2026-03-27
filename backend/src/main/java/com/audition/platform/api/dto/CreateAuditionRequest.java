package com.audition.platform.api.dto;

import jakarta.validation.Valid;
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

    /** @deprecated 레거시: 허용 문자열만. {@code tagIds}/{@code customTagNames} 가 있으면 무시됨 */
    private List<String> tags;

    /** 활성 catalog 태그 UUID 문자열 */
    private List<String> tagIds;

    /** 직접 입력 태그 (정리·중복 제거는 서버) */
    private List<String> customTagNames;

    @Valid
    private AuditionImagesDto images;

    @Size(max = 2000)
    private String videoUrl;

    private List<String> galleryImages;

    @NotBlank
    @Size(max = 200)
    private String agencyName;

    @Size(max = 2000)
    private String agencyLogo;

    private List<String> recruitFields;

    private List<String> qualifications;

    private List<String> schedules;

    @NotBlank
    @Size(max = 500)
    private String location;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    private List<String> benefits;

    private String countryCode;
    private String deadlineAt;

    /** SINGLE(기본) | MULTI_ROUND — 다단계 오디션 시 라운드 1 자동 생성 */
    @Pattern(regexp = "SINGLE|MULTI_ROUND")
    private String processMode = "SINGLE";

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public List<String> getTagIds() { return tagIds; }
    public void setTagIds(List<String> tagIds) { this.tagIds = tagIds; }
    public List<String> getCustomTagNames() { return customTagNames; }
    public void setCustomTagNames(List<String> customTagNames) { this.customTagNames = customTagNames; }
    public AuditionImagesDto getImages() { return images; }
    public void setImages(AuditionImagesDto images) { this.images = images; }
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
    public List<String> getQualifications() { return qualifications; }
    public void setQualifications(List<String> qualifications) { this.qualifications = qualifications; }
    public List<String> getSchedules() { return schedules; }
    public void setSchedules(List<String> schedules) { this.schedules = schedules; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) { this.benefits = benefits; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(String deadlineAt) { this.deadlineAt = deadlineAt; }
    public String getProcessMode() { return processMode; }
    public void setProcessMode(String processMode) { this.processMode = processMode; }
}
