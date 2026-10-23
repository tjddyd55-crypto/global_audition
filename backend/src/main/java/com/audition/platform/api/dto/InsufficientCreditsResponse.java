package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class InsufficientCreditsResponse {

    private final boolean success = false;
    private final String code = "INSUFFICIENT_CREDITS";
    private final String message;
    private final long requiredCredits;
    private final long currentCredits;
    private final long shortfallCredits;

    public InsufficientCreditsResponse(
            String message, long requiredCredits, long currentCredits, long shortfallCredits) {
        this.message = message;
        this.requiredCredits = requiredCredits;
        this.currentCredits = currentCredits;
        this.shortfallCredits = shortfallCredits;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public long getRequiredCredits() {
        return requiredCredits;
    }

    public long getCurrentCredits() {
        return currentCredits;
    }

    public long getShortfallCredits() {
        return shortfallCredits;
    }
}
