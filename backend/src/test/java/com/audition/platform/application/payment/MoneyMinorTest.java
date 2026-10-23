package com.audition.platform.application.payment;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MoneyMinorTest {

    @Test
    void scalesAndKrwChargeUseIntegers() {
        assertEquals(2, MoneyMinor.scale("USD"));
        assertEquals(0, MoneyMinor.scale("KRW"));
        assertEquals(0, MoneyMinor.scale("JPY"));
        assertEquals(1300, MoneyMinor.chargeMinor(1, new BigDecimal("1300"), "KRW", "HALF_UP"));
        assertEquals(2600, MoneyMinor.chargeMinor(2, new BigDecimal("1300"), "KRW", "HALF_UP"));
        assertEquals(200, MoneyMinor.chargeMinor(2, BigDecimal.ONE, "USD", "HALF_UP"));
    }

    @Test
    void partialRefundRejectsUnevenSplit() {
        assertEquals(1, MoneyMinor.creditsForRefund(2600, 2, 1300));
        assertThrows(IllegalArgumentException.class, () -> MoneyMinor.creditsForRefund(2600, 2, 1000));
    }
}
