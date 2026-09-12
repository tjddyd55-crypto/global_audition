package com.audition.platform.application.credit;

public class InsufficientCreditsException extends RuntimeException {

    public static final String CODE = "INSUFFICIENT_CREDITS";

    private final long requiredCredits;
    private final long currentCredits;

    public InsufficientCreditsException(long requiredCredits, long currentCredits) {
        super("크레딧이 부족합니다.");
        this.requiredCredits = requiredCredits;
        this.currentCredits = currentCredits;
    }

    public long getRequiredCredits() {
        return requiredCredits;
    }

    public long getCurrentCredits() {
        return currentCredits;
    }

    public long getShortfallCredits() {
        return Math.max(0, requiredCredits - currentCredits);
    }
}
