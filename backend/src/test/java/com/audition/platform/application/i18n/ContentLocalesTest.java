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
        assertEquals("ko", ContentLocales.DEFAULT);
        assertEquals("zh", ContentLocales.normalize("zh-Hant"));
        assertEquals("en", ContentLocales.normalize("pt-BR"));
        assertTrue(ContentLocales.PRIMARY.contains("mn"));
        assertFalse(ContentLocales.isSupported("xx"));
    }

    @Test
    void authoringTagKeepsLocalesOutsideTheEight() {
        assertEquals("ja", ContentLocales.requireAuthoringLocale("JA"));
        assertEquals("pt-BR", ContentLocales.requireAuthoringLocale("pt-BR"));
        assertEquals("zh-Hans", ContentLocales.canonicalTag("zh-Hans"));
        assertEquals("zh-Hant-TW", ContentLocales.canonicalTag("zh-hant-tw"));
        assertEquals("", ContentLocales.canonicalTag("not a locale"));
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> ContentLocales.requireAuthoringLocale("!!!"));
    }
}
