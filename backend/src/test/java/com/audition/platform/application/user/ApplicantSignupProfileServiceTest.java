package com.audition.platform.application.user;

import com.audition.platform.domain.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ApplicantSignupProfileServiceTest {

    private JdbcTemplate jdbc;
    private ApplicantSignupProfileService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new ApplicantSignupProfileService(jdbc);
    }

    @Test
    void storesCountryAndTimezoneForApplicants() {
        when(jdbc.queryForObject(any(String.class), eq(Integer.class), eq("KR"))).thenReturn(1);
        User user = new User();
        service.apply(user, "APPLICANT", "kr", "Asia/Seoul");
        assertEquals("KR", user.getCountryCode());
        assertEquals("Asia/Seoul", user.getTimezone());
        assertNull(user.getTextSourceLocale());
    }

    @Test
    void rejectsUnknownCountry() {
        when(jdbc.queryForObject(any(String.class), eq(Integer.class), eq("ZZ"))).thenReturn(0);
        User missing = new User();
        ResponseStatusException country = assertThrows(
                ResponseStatusException.class, () -> service.apply(missing, "APPLICANT", "ZZ", "Asia/Seoul"));
        assertEquals("COUNTRY_NOT_FOUND", country.getReason());
    }

    @Test
    void rejectsInvalidTimezoneBeforeLookingUpCountry() {
        User badZone = new User();
        ResponseStatusException zone = assertThrows(
                ResponseStatusException.class, () -> service.apply(badZone, "APPLICANT", "KR", "NotAZone"));
        assertEquals("TIMEZONE_INVALID", zone.getReason());
        verifyNoInteractions(jdbc);
    }

    @Test
    void blankApplicantCountryStaysEmpty() {
        User user = new User();
        service.apply(user, "APPLICANT", "  ", null);
        assertNull(user.getCountryCode());
        assertNull(user.getTimezone());
        verifyNoInteractions(jdbc);
    }
}
