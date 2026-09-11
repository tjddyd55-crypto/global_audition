package com.audition.platform.api.dto;

/**
 * Native/Web 지원·가입 보상 UX용 공개 런타임. 시크릿 없음.
 */
public class CreditRuntimePublicDto {

    private String applicationPaymentMode;
    private long applicationFeeCredits;
    private boolean signupCreditEnabled;
    private long signupCreditAmount;

    public CreditRuntimePublicDto() {
    }

    public CreditRuntimePublicDto(
            String applicationPaymentMode,
            long applicationFeeCredits,
            boolean signupCreditEnabled,
            long signupCreditAmount) {
        this.applicationPaymentMode = applicationPaymentMode;
        this.applicationFeeCredits = applicationFeeCredits;
        this.signupCreditEnabled = signupCreditEnabled;
        this.signupCreditAmount = signupCreditAmount;
    }

    public String getApplicationPaymentMode() {
        return applicationPaymentMode;
    }

    public void setApplicationPaymentMode(String applicationPaymentMode) {
        this.applicationPaymentMode = applicationPaymentMode;
    }

    public long getApplicationFeeCredits() {
        return applicationFeeCredits;
    }

    public void setApplicationFeeCredits(long applicationFeeCredits) {
        this.applicationFeeCredits = applicationFeeCredits;
    }

    public boolean isSignupCreditEnabled() {
        return signupCreditEnabled;
    }

    public void setSignupCreditEnabled(boolean signupCreditEnabled) {
        this.signupCreditEnabled = signupCreditEnabled;
    }

    public long getSignupCreditAmount() {
        return signupCreditAmount;
    }

    public void setSignupCreditAmount(long signupCreditAmount) {
        this.signupCreditAmount = signupCreditAmount;
    }
}
