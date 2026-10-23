package com.audition.platform.application.payment.gateway;

public enum ProviderCapability {
    ORDER_CREATE,
    SESSION,
    CONFIRM,
    STATUS,
    SUCCESS,
    FAIL,
    USER_CANCEL,
    FULL_REFUND,
    PARTIAL_REFUND,
    WEBHOOK,
    RETRY,
    IDEMPOTENCY
}
