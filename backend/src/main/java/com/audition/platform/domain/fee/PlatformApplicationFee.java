package com.audition.platform.domain.fee;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_application_fee")
public class PlatformApplicationFee {

    public static final short SINGLETON_ID = 1;
    public static final long MAX_USD = 10_000L;

    @Id
    private Short id;

    @Column(name = "amount_usd", nullable = false)
    private long amountUsd;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public Short getId() { return id; }
    public void setId(Short id) { this.id = id; }
    public long getAmountUsd() { return amountUsd; }
    public void setAmountUsd(long amountUsd) { this.amountUsd = amountUsd; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
