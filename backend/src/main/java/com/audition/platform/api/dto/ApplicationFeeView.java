package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class ApplicationFeeView {

    private long amountUsd;
    private Instant updatedAt;
    private UUID updatedBy;

    public long getAmountUsd() { return amountUsd; }
    public void setAmountUsd(long amountUsd) { this.amountUsd = amountUsd; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
