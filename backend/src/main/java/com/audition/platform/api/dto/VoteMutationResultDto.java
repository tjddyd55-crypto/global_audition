package com.audition.platform.api.dto;

public class VoteMutationResultDto {

    private String applicationId;
    private boolean replaced;

    public VoteMutationResultDto() {
    }

    public VoteMutationResultDto(String applicationId, boolean replaced) {
        this.applicationId = applicationId;
        this.replaced = replaced;
    }

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public boolean isReplaced() {
        return replaced;
    }

    public void setReplaced(boolean replaced) {
        this.replaced = replaced;
    }
}
