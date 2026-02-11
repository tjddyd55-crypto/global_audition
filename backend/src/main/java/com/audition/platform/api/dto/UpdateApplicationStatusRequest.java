package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateApplicationStatusRequest {

    @NotBlank
    @Pattern(regexp = "REVIEWED|ACCEPTED|REJECTED")
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
