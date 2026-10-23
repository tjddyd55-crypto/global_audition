package com.audition.platform.api.dto;

public class CreditBalanceResponse {

    private long balance;
    /** credit_lots FREE 잔량. 지갑 balance 와 더하거나 빼서 맞추지 않는다. */
    private long freeRemaining;
    private long paidRemaining;
    private long unclassifiedRemaining;
    /** 표시용 소비 정책 이름. 원장 계산은 바꾸지 않는다. */
    private String allocationPolicy;

    public CreditBalanceResponse() {
    }

    public CreditBalanceResponse(long balance) {
        this.balance = balance;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }

    public long getFreeRemaining() {
        return freeRemaining;
    }

    public void setFreeRemaining(long freeRemaining) {
        this.freeRemaining = freeRemaining;
    }

    public long getPaidRemaining() {
        return paidRemaining;
    }

    public void setPaidRemaining(long paidRemaining) {
        this.paidRemaining = paidRemaining;
    }

    public long getUnclassifiedRemaining() {
        return unclassifiedRemaining;
    }

    public void setUnclassifiedRemaining(long unclassifiedRemaining) {
        this.unclassifiedRemaining = unclassifiedRemaining;
    }

    public String getAllocationPolicy() {
        return allocationPolicy;
    }

    public void setAllocationPolicy(String allocationPolicy) {
        this.allocationPolicy = allocationPolicy;
    }
}
