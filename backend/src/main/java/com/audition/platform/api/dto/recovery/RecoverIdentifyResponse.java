package com.audition.platform.api.dto.recovery;

public class RecoverIdentifyResponse {

    private String accountIdentifier;

    public RecoverIdentifyResponse() {}

    public RecoverIdentifyResponse(String accountIdentifier) {
        this.accountIdentifier = accountIdentifier;
    }

    public String getAccountIdentifier() { return accountIdentifier; }
    public void setAccountIdentifier(String accountIdentifier) { this.accountIdentifier = accountIdentifier; }
}
