package com.audition.platform.application.recommend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AudienceCountryCodesTest {

    @Test
    void languageOnlyCodesAreNotCountries() {
        assertNull(AudienceCountryCodes.normalize("ko"));
        assertNull(AudienceCountryCodes.normalize("EN"));
        assertNull(AudienceCountryCodes.normalize("ja"));
    }

    @Test
    void mongoliaUzbekistanAndComorosStayCountries() {
        assertEquals("MN", AudienceCountryCodes.normalize("mn"));
        assertEquals("UZ", AudienceCountryCodes.normalize("uz"));
        assertEquals("KM", AudienceCountryCodes.normalize("km"));
        assertEquals("KH", AudienceCountryCodes.normalize("kh"));
        assertEquals("KR", AudienceCountryCodes.normalize("KR"));
    }

    @Test
    void blankIsGlobal() {
        assertEquals("GLOBAL", AudienceCountryCodes.normalize(null));
        assertEquals("GLOBAL", AudienceCountryCodes.normalize(" "));
        assertEquals("GLOBAL", AudienceCountryCodes.normalize("ALL"));
        assertTrue(AudienceCountryCodes.isGlobal("GLOBAL"));
    }
}
