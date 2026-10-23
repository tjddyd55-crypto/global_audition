package com.audition.platform.application.credit;

/**
 * 지갑 잔액과 원장에 마지막으로 기록된 잔액이 같은지 본다.
 * 거래 금액 합이 그 잔액과 다르면 과거 행이 비어 있는 것이며, 합을 잔액으로 바꾸지 않는다.
 */
public final class CreditLedgerConsistency {

    private CreditLedgerConsistency() {
    }

    public static boolean walletMatchesClosing(long wallet, Long closingBalance) {
        if (closingBalance == null) {
            return wallet == 0L;
        }
        return wallet == closingBalance;
    }
}
