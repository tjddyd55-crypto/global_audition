package com.audition.platform.application.payment;

import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PaymentEnvironmentGuardTest {

    @Test
    void productionBlocksMockAndLiveExecutionStaysOff() {
        Environment production = mock(Environment.class);
        when(production.getActiveProfiles()).thenReturn(new String[]{"production"});
        PaymentEnvironmentGuard prod = new PaymentEnvironmentGuard(production);
        assertFalse(prod.mockAllowed());
        assertFalse(prod.liveExecutionAllowed());

        Environment test = mock(Environment.class);
        when(test.getActiveProfiles()).thenReturn(new String[]{"test"});
        assertTrue(new PaymentEnvironmentGuard(test).mockAllowed());
        assertFalse(new PaymentEnvironmentGuard(test).liveExecutionAllowed());
    }
}
