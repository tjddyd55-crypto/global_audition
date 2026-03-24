package com.audition.platform.api.dto.admin;

import jakarta.validation.constraints.Size;

public class AdminRoundReviewRequest {

    @Size(max = 2000)
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
