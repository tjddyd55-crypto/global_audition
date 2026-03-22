package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateApplicationCommentRequest {

    @NotBlank(message = "applicationId is required")
    private String applicationId;

    @NotBlank(message = "content is required")
    @Size(max = 4000, message = "content too long")
    private String content;

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
