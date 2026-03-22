package com.audition.platform.api.dto;

public class AdminCreditAdjustResponse {

    private String userId;
    private long balanceAfter;

    public AdminCreditAdjustResponse() {
    }

    public AdminCreditAdjustResponse(String userId, long balanceAfter) {
        this.userId = userId;
        this.balanceAfter = balanceAfter;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public long getBalanceAfter() {
        return balanceAfter;
    }

    public void setBalanceAfter(long balanceAfter) {
        this.balanceAfter = balanceAfter;
    }
}
