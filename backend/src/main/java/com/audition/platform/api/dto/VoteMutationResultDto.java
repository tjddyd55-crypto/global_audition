package com.audition.platform.api.dto;

public class VoteMutationResultDto {

    private String applicationId;

    public VoteMutationResultDto() {
    }

    public VoteMutationResultDto(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }
}
