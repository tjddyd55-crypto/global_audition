package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

public class CastVoteRequest {

    @NotBlank(message = "applicationId is required")
    private String applicationId;

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }
}
