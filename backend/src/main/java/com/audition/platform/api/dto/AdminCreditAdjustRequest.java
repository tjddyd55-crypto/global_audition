package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AdminCreditAdjustRequest {

    private UUID userId;

    private String email;

    @NotNull
    private Long amount;

    /** 선택: 감사 로그·크레딧 거래 note */
    private String note;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getAmount() {
        return amount;
    }

    public void setAmount(Long amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
