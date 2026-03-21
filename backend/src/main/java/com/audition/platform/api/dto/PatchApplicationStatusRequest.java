package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * PATCH /api/applications/{id}/status — API/DB 모두 REVIEWING | ACCEPTED | REJECTED (심사 상태, 투표와 무관)
 */
public class PatchApplicationStatusRequest {

    @NotBlank
    @Pattern(regexp = "REVIEWING|ACCEPTED|REJECTED")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
