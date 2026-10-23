package com.audition.platform.domain.payment;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_orders")
public class PaymentOrder {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "order_no", nullable = false, unique = true, length = 64)
    private String orderNo;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "package_id", nullable = false)
    private UUID packageId;

    @Column(nullable = false, length = 32)
    private String provider;

    /** 청구 금액 (USD, 달러 단위). Stripe 연동 시 {@link com.audition.platform.application.payment.UsdMoney#toStripeCents} 사용. */
    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private PaymentOrderStatus status;

    @Column(nullable = false)
    private long credits;

    @Column(name = "bonus_credits", nullable = false)
    private long bonusCredits;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "provider_tx_id", length = 256)
    private String providerTxId;

    @Column(name = "fail_reason", columnDefinition = "TEXT")
    private String failReason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_payload", columnDefinition = "jsonb")
    private JsonNode rawPayload;

    /** 토스 paymentKey. 승인 이후 저장. 유니크(부분 인덱스). */
    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(length = 8)
    private String environment;

    @Column(name = "payment_country", length = 2)
    private String paymentCountry;

    @Column(name = "charge_currency", length = 3)
    private String chargeCurrency;

    @Column(name = "charge_amount_minor")
    private Long chargeAmountMinor;

    @Column(name = "fx_rate_id")
    private UUID fxRateId;

    @Column(name = "fx_rate", precision = 24, scale = 8)
    private BigDecimal fxRate;

    @Column(name = "credits_issued")
    private Long creditsIssued;

    @Column(name = "refunded_minor", nullable = false)
    private long refundedMinor;

    @Column(name = "refunded_credits", nullable = false)
    private long refundedCredits;

    @Column(name = "provider_config_id", length = 64)
    private String providerConfigId;

    @Column(name = "method_code", length = 40)
    private String methodCode;

    @Column(name = "idempotency_key", length = 80)
    private String idempotencyKey;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getPackageId() {
        return packageId;
    }

    public void setPackageId(UUID packageId) {
        this.packageId = packageId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentOrderStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentOrderStatus status) {
        this.status = status;
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

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }

    public String getProviderTxId() {
        return providerTxId;
    }

    public void setProviderTxId(String providerTxId) {
        this.providerTxId = providerTxId;
    }

    public String getFailReason() {
        return failReason;
    }

    public void setFailReason(String failReason) {
        this.failReason = failReason;
    }

    public JsonNode getRawPayload() {
        return rawPayload;
    }

    public void setRawPayload(JsonNode rawPayload) {
        this.rawPayload = rawPayload;
    }

    public String getPaymentKey() {
        return paymentKey;
    }

    public void setPaymentKey(String paymentKey) {
        this.paymentKey = paymentKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getPaymentCountry() {
        return paymentCountry;
    }

    public void setPaymentCountry(String paymentCountry) {
        this.paymentCountry = paymentCountry;
    }

    public String getChargeCurrency() {
        return chargeCurrency;
    }

    public void setChargeCurrency(String chargeCurrency) {
        this.chargeCurrency = chargeCurrency;
    }

    public Long getChargeAmountMinor() {
        return chargeAmountMinor;
    }

    public void setChargeAmountMinor(Long chargeAmountMinor) {
        this.chargeAmountMinor = chargeAmountMinor;
    }

    public UUID getFxRateId() {
        return fxRateId;
    }

    public void setFxRateId(UUID fxRateId) {
        this.fxRateId = fxRateId;
    }

    public BigDecimal getFxRate() {
        return fxRate;
    }

    public void setFxRate(BigDecimal fxRate) {
        this.fxRate = fxRate;
    }

    public Long getCreditsIssued() {
        return creditsIssued;
    }

    public void setCreditsIssued(Long creditsIssued) {
        this.creditsIssued = creditsIssued;
    }

    public long getRefundedMinor() {
        return refundedMinor;
    }

    public void setRefundedMinor(long refundedMinor) {
        this.refundedMinor = refundedMinor;
    }

    public long getRefundedCredits() {
        return refundedCredits;
    }

    public void setRefundedCredits(long refundedCredits) {
        this.refundedCredits = refundedCredits;
    }

    public String getProviderConfigId() {
        return providerConfigId;
    }

    public void setProviderConfigId(String providerConfigId) {
        this.providerConfigId = providerConfigId;
    }

    public String getMethodCode() {
        return methodCode;
    }

    public void setMethodCode(String methodCode) {
        this.methodCode = methodCode;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
