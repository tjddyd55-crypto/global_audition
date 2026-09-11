package com.audition.platform.domain.recovery;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecoveryCodeFormatterTest {

    @Test
    void generateHasGroupedShapeAndValidAlphabet() {
        String display = RecoveryCodeFormatter.generateDisplayCode();
        assertTrue(display.matches("[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}"));
        assertFalse(display.contains("0"));
        assertFalse(display.contains("1"));
        assertFalse(display.contains("O"));
        assertFalse(display.contains("I"));
        assertFalse(display.contains("L"));
    }

    @Test
    void normalizeStripsDashesAndLowercase() {
        assertEquals("ABCD2345EFGH", RecoveryCodeFormatter.normalize("abcd-2345-efgh"));
        assertTrue(RecoveryCodeFormatter.hasValidShape("ABCD2345EFGH"));
        assertFalse(RecoveryCodeFormatter.hasValidShape("SHORT"));
    }
}
