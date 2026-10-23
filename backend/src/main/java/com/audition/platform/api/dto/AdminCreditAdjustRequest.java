package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AdminCreditAdjustRequest {

    private UUID userId;

    private String email;

    @NotNull
    private Long amount;

    /** 지급/차감 사유. 감사 로그·원장 note 필수. */
    @NotBlank(message = "조정 사유가 필요합니다.")
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
