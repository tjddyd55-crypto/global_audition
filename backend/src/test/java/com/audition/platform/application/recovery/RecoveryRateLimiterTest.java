package com.audition.platform.application.recovery;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RecoveryRateLimiterTest {

    @Test
    void identifyLocksAfterWindowBudget() {
        RecoveryRateLimiter limiter = new RecoveryRateLimiter();
        for (int i = 0; i < 8; i++) {
            assertDoesNotThrow(() -> limiter.checkIdentify("10.0.0.1"));
        }
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> limiter.checkIdentify("10.0.0.1"));
        assertEquals(429, ex.getStatusCode().value());
    }
}
