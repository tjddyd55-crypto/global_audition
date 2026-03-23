package com.audition.platform.application.payment;

import com.audition.platform.domain.payment.PaymentOrder;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * 실제 PG 연동 시 구현체만 교체하면 된다.
 */
public interface PaymentProvider {

    /** 예: MOCK, TOSS, STRIPE */
    String getCode();

    PaymentPrepareResult preparePayment(PaymentOrder order);

    /** 성공 콜백 직전 서명 검증 등 (mock 은 no-op) */
    default void handleSuccessCallback(JsonNode payload) {
        // optional
    }

    default void handleFailureCallback(JsonNode payload) {
        // optional
    }
}
