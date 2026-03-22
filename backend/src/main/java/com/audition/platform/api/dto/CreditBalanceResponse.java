package com.audition.platform.api.dto;

public class CreditBalanceResponse {

    private long balance;

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
}
