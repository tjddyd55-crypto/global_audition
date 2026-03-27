package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * PATCH /api/applications/{id}/status — 기획사 보드 상태.
 * PENDING→DB SUBMITTED, APPROVED·ACCEPTED→ACCEPTED, REVIEWING, REJECTED.
 */
public class PatchApplicationStatusRequest {

    @NotBlank
    @Pattern(regexp = "PENDING|REVIEWING|APPROVED|REJECTED|ACCEPTED")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
