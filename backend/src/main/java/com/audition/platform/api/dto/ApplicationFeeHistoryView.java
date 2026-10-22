package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.UUID;

public class ApplicationFeeHistoryView {

    private UUID id;
    private long oldAmountUsd;
    private long newAmountUsd;
    private UUID changedBy;
    private Instant changedAt;
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
