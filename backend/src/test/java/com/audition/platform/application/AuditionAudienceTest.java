package com.audition.platform.application;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuditionAudienceTest {

    @Test
    void mongoliaSeesMnAndGlobal() {
        assertTrue(AuditionService.matchesAudience("MN", "MN"));
        assertTrue(AuditionService.matchesAudience("GLOBAL", "MN"));
        assertTrue(AuditionService.matchesAudience("", "MN"));
        assertFalse(AuditionService.matchesAudience("KR", "MN"));
        assertFalse(AuditionService.matchesAudience("JP", "MN"));
    }

    @Test
    void koreaSeesKrAndGlobal() {
        assertTrue(AuditionService.matchesAudience("KR", "KR"));
        assertTrue(AuditionService.matchesAudience("GLOBAL", "KR"));
        assertFalse(AuditionService.matchesAudience("MN", "KR"));
    }

    @Test
    void globalOrBlankSeesAll() {
        assertTrue(AuditionService.matchesAudience("MN", "GLOBAL"));
        assertTrue(AuditionService.matchesAudience("KR", null));
        assertTrue(AuditionService.matchesAudience("JP", ""));
    }

    @Test
    void cambodiaAndUzbekistanAreRecruitmentCountries() {
        assertEquals("KH", AuditionService.normalizeCountryCode("kh"));
        assertEquals("KH", AuditionService.normalizeCountryCode("Cambodia"));
        assertEquals("KH", AuditionService.normalizeCountryCode("KHM"));
        assertEquals("UZ", AuditionService.normalizeCountryCode("uz"));
        assertEquals("UZ", AuditionService.normalizeCountryCode("UZBEKISTAN"));
        assertEquals("UZ", AuditionService.normalizeCountryCode("UZB"));
        assertEquals("MN", AuditionService.normalizeCountryCode("mn"));
        assertEquals("JP", AuditionService.normalizeCountryCode("JP"));

        assertTrue(AuditionService.matchesAudience("KH", "KH"));
        assertTrue(AuditionService.matchesAudience("GLOBAL", "KH"));
        assertFalse(AuditionService.matchesAudience("UZ", "KH"));
        assertFalse(AuditionService.matchesAudience("KR", "UZ"));
        assertTrue(AuditionService.matchesAudience("UZ", "UZ"));
        assertFalse(AuditionService.matchesAudience("KH", "MN"));
        assertTrue(AuditionService.matchesPublicCountry("KR", "UZ", "UZ"));
    }
}
