package com.audition.platform.application.i18n;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ContentLocalesTest {

    @Test
    void normalizesPrimaryLocalesAndFallsBackToEn() {
        assertEquals("mn", ContentLocales.normalize("mn-MN"));
        assertEquals("ko", ContentLocales.normalize("KO"));
        assertEquals("en", ContentLocales.normalize("xx"));
        assertEquals(ContentLocales.DEFAULT, ContentLocales.normalize(null));
        assertTrue(ContentLocales.PRIMARY.contains("mn"));
        assertFalse(ContentLocales.isSupported("xx"));
    }
}
