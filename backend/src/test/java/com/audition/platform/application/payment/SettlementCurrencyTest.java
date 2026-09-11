package com.audition.platform.application.payment;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SettlementCurrencyTest {

    @Test
    void tossAmountIsIntegerMajorUnitDollarsNotCents() {
        assertEquals(1L, SettlementCurrency.toTossAmount(new BigDecimal("1"), "USD"));
        assertEquals(5L, SettlementCurrency.toTossAmount(new BigDecimal("5.00"), "USD"));
        assertEquals(10L, SettlementCurrency.toTossAmount(new BigDecimal("10.00"), "usd"));
    }

    @Test
    void rejectsFractionalUsdInsteadOfSilentRound() {
        assertThrows(ResponseStatusException.class,
                () -> SettlementCurrency.toTossAmount(new BigDecimal("4.99"), "USD"));
        assertThrows(ResponseStatusException.class,
                () -> SettlementCurrency.requireWholeUsd(new BigDecimal("1.50")));
    }

    @Test
    void rejectsNonUsdInsteadOfInventingFx() {
        assertThrows(ResponseStatusException.class, () -> SettlementCurrency.requireUsd("KRW"));
        assertThrows(ResponseStatusException.class,
                () -> SettlementCurrency.toTossAmount(new BigDecimal("10"), "KRW"));
    }

    @Test
    void blankCurrencyDefaultsToUsd() {
        assertEquals(SettlementCurrency.CODE, SettlementCurrency.requireUsd(null));
        assertEquals(SettlementCurrency.CODE, SettlementCurrency.requireUsd(""));
    }
}
