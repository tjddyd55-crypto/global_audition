package com.audition.platform.application.credit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CreditLedgerConsistencyTest {

    @Test
    void walletMatchesTheLatestLedgerBalance() {
        assertTrue(CreditLedgerConsistency.walletMatchesClosing(9, 9L));
        assertTrue(CreditLedgerConsistency.walletMatchesClosing(0, null));
    }

    @Test
    void doesNotTreatAPartialAmountSumAsTheBalance() {
        assertFalse(CreditLedgerConsistency.walletMatchesClosing(9, null));
        assertFalse(CreditLedgerConsistency.walletMatchesClosing(9, -1L));
    }
}
