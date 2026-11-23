package com.audition.platform.application.saves;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditionSaveStatusTest {

    private static final Instant NOW = Instant.parse("2026-11-23T00:00:00Z");

    @Test
    void openWithoutStartIsOpen() {
        assertEquals(AuditionSaveStatus.OPEN, AuditionSaveStatus.of("OPEN", null, NOW));
    }

    @Test
    void openWithPastOrCurrentStartIsOpen() {
        assertEquals(AuditionSaveStatus.OPEN, AuditionSaveStatus.of("OPEN", NOW, NOW));
        assertEquals(AuditionSaveStatus.OPEN, AuditionSaveStatus.of("OPEN", NOW.minusSeconds(60), NOW));
    }

    @Test
    void openWithFutureStartIsUpcoming() {
        assertEquals(AuditionSaveStatus.UPCOMING, AuditionSaveStatus.of("OPEN", NOW.plusSeconds(3600), NOW));
    }

    @Test
    void closedIsClosedEvenIfStartIsFuture() {
        assertEquals(AuditionSaveStatus.CLOSED, AuditionSaveStatus.of("CLOSED", NOW.plusSeconds(3600), NOW));
    }

    @Test
    void draftMissingAndUnknownAreUnavailable() {
        assertEquals(AuditionSaveStatus.UNAVAILABLE, AuditionSaveStatus.of("DRAFT", NOW, NOW));
        assertEquals(AuditionSaveStatus.UNAVAILABLE, AuditionSaveStatus.of(null, NOW, NOW));
        assertEquals(AuditionSaveStatus.UNAVAILABLE, AuditionSaveStatus.of("HIDDEN", NOW, NOW));
    }

    @Test
    void onlyOpenAndClosedAreSavable() {
        assertTrue(AuditionSaveStatus.isPubliclySavable("OPEN"));
        assertTrue(AuditionSaveStatus.isPubliclySavable("CLOSED"));
        assertFalse(AuditionSaveStatus.isPubliclySavable("DRAFT"));
        assertFalse(AuditionSaveStatus.isPubliclySavable(null));
    }
}
