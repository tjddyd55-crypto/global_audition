package com.audition.platform.application;

import org.junit.jupiter.api.Test;

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
}
