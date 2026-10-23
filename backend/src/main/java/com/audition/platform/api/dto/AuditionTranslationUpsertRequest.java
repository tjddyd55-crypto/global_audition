package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class AuditionTranslationUpsertRequest {

    @NotBlank
    private String title;
    private String description;
    private String location;
    private String agencyName;
    private List<String> recruitFields;
    private List<String> qualifications;
    private List<String> schedules;
    private List<String> benefits;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }
    public List<String> getRecruitFields() { return recruitFields; }
    public void setRecruitFields(List<String> recruitFields) { this.recruitFields = recruitFields; }
    public List<String> getQualifications() { return qualifications; }
    public void setQualifications(List<String> qualifications) { this.qualifications = qualifications; }
    public List<String> getSchedules() { return schedules; }
    public void setSchedules(List<String> schedules) { this.schedules = schedules; }
    public List<String> getBenefits() { return benefits; }
    public void setBenefits(List<String> benefits) { this.benefits = benefits; }
}
