package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CreateAuditionRequest {

    @NotBlank
    private String title;

    private String description;

    @Pattern(regexp = "DRAFT|OPEN|CLOSED")
    private String status = "DRAFT";

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
