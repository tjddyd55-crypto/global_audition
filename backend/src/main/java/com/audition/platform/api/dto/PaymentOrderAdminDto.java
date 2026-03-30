package com.audition.platform.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** 슈퍼관리자 결제 주문 목록용 (PG raw 제외). */
public class PaymentOrderAdminDto {

    private UUID id;
    private String orderNo;
    private UUID userId;
    private UUID packageId;
    private String provider;
    private BigDecimal amount;
    private String currency;
    private String status;
    private long credits;
    private long bonusCredits;
    private Instant paidAt;
    private String providerTxId;
    private String failReason;
    private Instant createdAt;
    private Instant updatedAt;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
}
