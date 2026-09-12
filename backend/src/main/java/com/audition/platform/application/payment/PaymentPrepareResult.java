package com.audition.platform.application.payment;

/**
 * {@link PaymentProvider#preparePayment} 결과 — PG 연동 시 토큰·URL 등 확장.
 */
public class PaymentPrepareResult {

    private final String redirectUrl;
    private final String clientKey;
    private final Long tossAmount;
    private final String orderName;
    private final String successUrl;
    private final String failUrl;

    public PaymentPrepareResult(String redirectUrl) {
        this(redirectUrl, null, null, null, null, null);
    }

    public PaymentPrepareResult(
            String redirectUrl,
            String clientKey,
            Long tossAmount,
            String orderName,
            String successUrl,
            String failUrl) {
        this.redirectUrl = redirectUrl;
        this.clientKey = clientKey;
        this.tossAmount = tossAmount;
        this.orderName = orderName;
        this.successUrl = successUrl;
        this.failUrl = failUrl;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public String getClientKey() {
        return clientKey;
    }

    public Long getTossAmount() {
        return tossAmount;
    }

    public String getOrderName() {
        return orderName;
    }

    public String getSuccessUrl() {
        return successUrl;
    }

    public String getFailUrl() {
        return failUrl;
    }
}
