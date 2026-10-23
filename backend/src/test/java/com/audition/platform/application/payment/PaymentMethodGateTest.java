package com.audition.platform.application.payment;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaymentMethodGateTest {

    @Test
    void showsMethodOnlyWhenEveryConditionHolds() {
        assertTrue(PaymentMethodGate.available(offer("MOCK", "TEST_READY", "CONNECTED", true, true, true), true, false));
        assertFalse(PaymentMethodGate.available(offer("MOCK", "TEST_READY", "CONNECTED", true, true, true), false, false));
        assertFalse(PaymentMethodGate.available(offer("TEST", "APPROVAL_PENDING", "CONNECTED", true, true, true), true, false));
        assertFalse(PaymentMethodGate.available(offer("TEST", "TEST_READY", "NOT_CHECKED", true, true, true), true, false));
        assertFalse(PaymentMethodGate.available(offer("TEST", "TEST_READY", "CONNECTED", true, false, true), true, false));
        assertFalse(PaymentMethodGate.available(offer("LIVE", "LIVE_READY", "CONNECTED", true, true, true), true, false));
        assertFalse(PaymentMethodGate.available(offer("TEST", "NOT_CONFIGURED", "NOT_CHECKED", false, true, false), true, false));
    }

    private static PaymentMethodGate.MethodOffer offer(
            String environment, String status, String connection, boolean enabled, boolean implemented, boolean methodEnabled) {
        return new PaymentMethodGate.MethodOffer(
                "P", environment, status, connection, enabled, implemented,
                "KR", "KRW", "CARD", "KR", "KR", "CARD", "KRW", methodEnabled);
    }
}
