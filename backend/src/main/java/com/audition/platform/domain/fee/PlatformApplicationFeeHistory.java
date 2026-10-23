package com.audition.platform.domain.fee;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_application_fee_history")
public class PlatformApplicationFeeHistory {

    @Id
    private UUID id;

    @Column(name = "old_amount_usd", nullable = false)
    private long oldAmountUsd;

    @Column(name = "new_amount_usd", nullable = false)
    private long newAmountUsd;

    @Column(name = "changed_by")
    private UUID changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt = Instant.now();

    @Column(nullable = false)
    private String source;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public long getOldAmountUsd() { return oldAmountUsd; }
    public void setOldAmountUsd(long oldAmountUsd) { this.oldAmountUsd = oldAmountUsd; }
    public long getNewAmountUsd() { return newAmountUsd; }
    public void setNewAmountUsd(long newAmountUsd) { this.newAmountUsd = newAmountUsd; }
    public UUID getChangedBy() { return changedBy; }
    public void setChangedBy(UUID changedBy) { this.changedBy = changedBy; }
    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
