package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

public class CastVoteRequest {

    @NotBlank(message = "auditionId is required")
    private String auditionId;

    @NotBlank(message = "applicationId is required")
    private String applicationId;

    public String getAuditionId() {
        return auditionId;
    }

    public void setAuditionId(String auditionId) {
        this.auditionId = auditionId;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }
}
