package com.audition.platform.application.payment;

/**
 * {@link PaymentProvider#preparePayment} 결과 — PG 연동 시 토큰·URL 등 확장.
 */
public class PaymentPrepareResult {

    private final String redirectUrl;

    public PaymentPrepareResult(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }
}
