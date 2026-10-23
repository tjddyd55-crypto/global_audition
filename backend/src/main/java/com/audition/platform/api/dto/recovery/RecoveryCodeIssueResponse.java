package com.audition.platform.api.dto.recovery;

public class RecoveryCodeIssueResponse {

    private String recoveryCode;
    private String accountIdentifier;

    public RecoveryCodeIssueResponse() {}

    public RecoveryCodeIssueResponse(String recoveryCode, String accountIdentifier) {
        this.recoveryCode = recoveryCode;
        this.accountIdentifier = accountIdentifier;
    }

    public String getRecoveryCode() { return recoveryCode; }
    public void setRecoveryCode(String recoveryCode) { this.recoveryCode = recoveryCode; }
    public String getAccountIdentifier() { return accountIdentifier; }
    public void setAccountIdentifier(String accountIdentifier) { this.accountIdentifier = accountIdentifier; }
}
