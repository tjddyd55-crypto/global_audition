package com.audition.platform.api.dto.recovery;

import jakarta.validation.constraints.NotBlank;

public class RecoverIdentifyRequest {

    @NotBlank
    private String recoveryCode;

    public String getRecoveryCode() { return recoveryCode; }
    public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
}
