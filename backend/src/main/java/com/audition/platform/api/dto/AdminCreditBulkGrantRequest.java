package com.audition.platform.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AdminCreditBulkGrantRequest {

    @NotNull
    @Valid
    private BulkGrantConditionDto condition;

    @NotNull
    @Min(1)
    @Max(10_000)
    private Long amount;

    @NotBlank
    private String reason;

    private String note;

    public BulkGrantConditionDto getCondition() {
        return condition;
    }

    public void setCondition(BulkGrantConditionDto condition) {
        this.condition = condition;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
