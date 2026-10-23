package com.audition.platform.api.dto;

public class CreditBalanceResponse {

    private long balance;
    /** credit_lots FREE 잔량. 지갑 balance 와 더하거나 빼서 맞추지 않는다. */
    private long freeRemaining;
    private long paidRemaining;
    private long unclassifiedRemaining;
    /** 표시용 소비 정책 이름. 원장 계산은 바꾸지 않는다. */
    private String allocationPolicy;
    /** 원장에 마지막으로 기록된 잔액. 거래가 없으면 null. */
    private Long ledgerClosingBalance;
    /** 기록된 거래 금액의 합. 시작 행이 없으면 지갑 잔액과 다를 수 있다. */
    private long ledgerAmountSum;
    private boolean ledgerMatchesWallet;

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

    public Long getLedgerClosingBalance() {
        return ledgerClosingBalance;
    }

    public void setLedgerClosingBalance(Long ledgerClosingBalance) {
        this.ledgerClosingBalance = ledgerClosingBalance;
    }

    public long getLedgerAmountSum() {
        return ledgerAmountSum;
    }

    public void setLedgerAmountSum(long ledgerAmountSum) {
        this.ledgerAmountSum = ledgerAmountSum;
    }

    public boolean isLedgerMatchesWallet() {
        return ledgerMatchesWallet;
    }

    public void setLedgerMatchesWallet(boolean ledgerMatchesWallet) {
        this.ledgerMatchesWallet = ledgerMatchesWallet;
    }
}
