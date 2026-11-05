package com.audition.platform.application.user;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimezonesTest {

    @Test
    void acceptsTheThreeApplicantZones() {
        assertEquals("Asia/Ulaanbaatar", Timezones.canonical(" Asia/Ulaanbaatar "));
        assertEquals("Asia/Seoul", Timezones.canonical("Asia/Seoul"));
        assertEquals("Asia/Tokyo", Timezones.canonical("Asia/Tokyo"));
    }

    @Test
    void blankIsAbsentAndInvalidIsRejected() {
        assertNull(Timezones.optional("  "));
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> Timezones.canonical("Mars/Olympus"));
        assertEquals(400, ex.getStatusCode().value());
        assertEquals("TIMEZONE_INVALID", ex.getReason());
    }
}
