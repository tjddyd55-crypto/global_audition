package com.audition.platform.api.dto;

public class ApplicationStatusPatchDataDto {

    private String applicationId;
    private String status;

    public ApplicationStatusPatchDataDto() {
    }

    public ApplicationStatusPatchDataDto(String applicationId, String status) {
        this.applicationId = applicationId;
        this.status = status;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
