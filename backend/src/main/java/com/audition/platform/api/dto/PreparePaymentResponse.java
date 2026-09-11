package com.audition.platform.api.dto;

import java.math.BigDecimal;

/**
 * PG 연동 전 단계: 주문 식별자와 결제 금액만 확정한다. 실제 결제는 수행하지 않는다.
 */
public class PreparePaymentResponse {

    /** 비즈니스 주문번호 (payment_orders.order_no) */
    private String orderNo;

    /** 하위 호환: orderNo 와 동일 */
    private String orderId;

    private String packageId;
    private String packageName;

    /** 청구 금액 (USD 달러). */
    private BigDecimal amount;

    /** Stripe PaymentIntent 등에 넣을 smallest unit (센트). */
    private long stripeAmountCents;

    private long credits;
    private long bonusCredits;
    private String currency;
    private String status;
    private String message;

    /** 목 PG 등 — 프론트 라우팅용 상대 경로 */
    private String redirectUrl;

    private String provider;

    /** 토스 위젯용 클라이언트 키. 시크릿은 절대 내려주지 않는다. */
    private String clientKey;
    /** 토스 confirm 에 쓰는 정수 금액(서버 확정). */
    private Long tossAmount;
    private String orderName;
    private String successUrl;
    private String failUrl;
    private String variantKey;
    /** Toss v2 method. USD 는 FOREIGN_EASY_PAY. */
    private String tossMethod;
    private String foreignEasyPayProvider;

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getPackageId() {
        return packageId;
    }

    public void setPackageId(String packageId) {
        this.packageId = packageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public long getStripeAmountCents() {
        return stripeAmountCents;
    }

    public void setStripeAmountCents(long stripeAmountCents) {
        this.stripeAmountCents = stripeAmountCents;
    }

    public long getCredits() {
        return credits;
    }

    public void setCredits(long credits) {
        this.credits = credits;
    }

    public long getBonusCredits() {
        return bonusCredits;
    }

    public void setBonusCredits(long bonusCredits) {
        this.bonusCredits = bonusCredits;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getClientKey() {
        return clientKey;
    }

    public void setClientKey(String clientKey) {
        this.clientKey = clientKey;
    }

    public Long getTossAmount() {
        return tossAmount;
    }

    public void setTossAmount(Long tossAmount) {
        this.tossAmount = tossAmount;
    }

    public String getOrderName() {
        return orderName;
    }

    public void setOrderName(String orderName) {
        this.orderName = orderName;
    }

    public String getSuccessUrl() {
        return successUrl;
    }

    public void setSuccessUrl(String successUrl) {
        this.successUrl = successUrl;
    }

    public String getFailUrl() {
        return failUrl;
    }

    public void setFailUrl(String failUrl) {
        this.failUrl = failUrl;
    }

    public String getVariantKey() {
        return variantKey;
    }

    public void setVariantKey(String variantKey) {
        this.variantKey = variantKey;
    }
    public String getTossMethod() { return tossMethod; }
    public void setTossMethod(String tossMethod) { this.tossMethod = tossMethod; }
    public String getForeignEasyPayProvider() { return foreignEasyPayProvider; }
    public void setForeignEasyPayProvider(String foreignEasyPayProvider) {
        this.foreignEasyPayProvider = foreignEasyPayProvider;
    }
}
