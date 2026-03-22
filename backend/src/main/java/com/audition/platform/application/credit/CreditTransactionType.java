package com.audition.platform.application.credit;

/**
 * {@code credit_transactions.type} 값. DB 문자열과 동일하게 유지.
 */
public final class CreditTransactionType {

    public static final String CHARGE = "CHARGE";
    public static final String USE = "USE";
    public static final String REFUND = "REFUND";
    /** 운영자 지급(선물) */
    public static final String GRANT = "GRANT";

    private CreditTransactionType() {
    }
}
