package com.audition.platform.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateAuditionRequest {

    @Size(min = 1, max = 120)
    private String title;

    @Size(max = 5000)
    private String description;

    @Pattern(regexp = "DRAFT|OPEN|CLOSED")
    private String status;

    private String countryCode;

    private String category;

    private String deadlineAt;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDeadlineAt() { return deadlineAt; }
    public void setDeadlineAt(String deadlineAt) { this.deadlineAt = deadlineAt; }
}
