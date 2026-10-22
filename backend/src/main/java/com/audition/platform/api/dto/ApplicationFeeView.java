package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class ApplicationFeeView {

    private long amountUsd;
    /** {@link com.audition.platform.application.credit.UsdCreditParity} 로 계산한 차감 크레딧. */
    private long creditQuantity;
    private Instant updatedAt;
    private UUID updatedBy;

    public long getAmountUsd() { return amountUsd; }
    public void setAmountUsd(long amountUsd) { this.amountUsd = amountUsd; }
    public long getCreditQuantity() { return creditQuantity; }
    public void setCreditQuantity(long creditQuantity) { this.creditQuantity = creditQuantity; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
