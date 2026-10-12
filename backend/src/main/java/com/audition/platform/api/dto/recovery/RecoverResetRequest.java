package com.audition.platform.api.dto.recovery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RecoverResetRequest {

    @NotBlank
    private String recoveryCode;

    @NotBlank
    @Size(min = 6)
    private String newPassword;

    public String getRecoveryCode() { return recoveryCode; }
    public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
