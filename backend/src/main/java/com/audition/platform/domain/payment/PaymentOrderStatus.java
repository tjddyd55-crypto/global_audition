package com.audition.platform.domain.payment;

/**
 * {@code payment_orders.status}
 * <p>흐름: CREATED(행 생성) → READY(PG/목 결제 단계 진입 가능) → PAID | FAILED | CANCELLED
 */
public enum PaymentOrderStatus {
    CREATED,
    READY,
    PAID,
    FAILED,
    CANCELLED
}
