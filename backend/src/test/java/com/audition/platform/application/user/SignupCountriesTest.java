package com.audition.platform.application.user;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SignupCountriesTest {
    @Test void listsKnownCountriesInTheRequestedLanguage() {
        assertTrue(SignupCountries.list("ko").stream().anyMatch(c -> c.code().equals("NP") && c.englishName().equals("Nepal") && !c.name().isBlank()));
        assertFalse(SignupCountries.list("en").stream().anyMatch(c -> c.code().equals("ZZ")));
        assertEquals(SignupCountries.list("en"), SignupCountries.list("untrusted"));
    }
    @Test void registersARealCountryAsInactiveWithoutChangingExistingRows() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("NP"))).thenReturn(0);
        SignupCountries.ensureRegistered(jdbc, "NP");
        verify(jdbc).update(contains("'INACTIVE'"), eq("NP"), eq("Nepal"), eq("NPR"));
        verify(jdbc, never()).execute(anyString());
    }
    @Test void neverActivatesOrOverwritesAnExistingCountry() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("KR"))).thenReturn(1);
        SignupCountries.ensureRegistered(jdbc, "KR");
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }
    @Test void rejectsUnknownCodesInsteadOfPersistingFreeText() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        var error = assertThrows(ResponseStatusException.class, () -> SignupCountries.ensureRegistered(jdbc, "ZZ"));
        assertEquals("COUNTRY_NOT_FOUND", error.getReason());
        verify(jdbc, never()).update(anyString(), any(Object[].class));
    }
}
