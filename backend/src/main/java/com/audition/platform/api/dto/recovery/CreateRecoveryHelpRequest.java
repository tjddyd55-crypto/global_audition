package com.audition.platform.api.dto.recovery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateRecoveryHelpRequest {

    @NotBlank
    @Size(max = 200)
    private String accountIdentifier;

    @NotBlank
    @Size(max = 120)
    private String requesterName;

    @NotBlank
    @Size(max = 200)
    private String contact;

    @Size(max = 2000)
    private String message;

    public String getAccountIdentifier() { return accountIdentifier; }
    public void setAccountIdentifier(String accountIdentifier) { this.accountIdentifier = accountIdentifier; }
    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
