package com.audition.platform.application.i18n;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Bcp47TagsTest {

    @Test
    void keepsScriptAndRegionCanonical() {
        assertEquals("pt-BR", Bcp47Tags.canonicalize("pt-br"));
        assertEquals("pt-BR", Bcp47Tags.canonicalize("PT-br"));
        assertEquals("zh-Hant", Bcp47Tags.canonicalize("zh-hant"));
        assertEquals("zh-Hant-TW", Bcp47Tags.canonicalize("zh-hant-tw"));
        assertEquals("en", Bcp47Tags.canonicalize("EN"));
        assertEquals("", Bcp47Tags.canonicalize("not a locale"));
    }

    @Test
    void viewingDefaultIsEnglishAndExistingAuthoringDefaultStaysKorean() {
        LocaleRegistry registry = new LocaleRegistry();
        assertEquals("en", registry.viewingDefault());
        assertEquals("ko", ContentLocales.DEFAULT);
        assertTrue(registry.providerSupports("zh-Hant"));
        assertFalse(registry.providerSupports("pt-BR"));
        assertTrue(registry.uiLocale("mn"));
        assertFalse(registry.uiLocale("ja"));
        assertEquals(java.util.List.of("en"), registry.publicSelector());
        assertEquals("ko", registry.agencyUiLocale());
        assertEquals("ko", registry.superAdminUiLocale());
        assertEquals(java.util.List.of("en", "ko"), registry.activeTargets());
        assertTrue(registry.activeTarget("en"));
        assertFalse(registry.activeTarget("mn"));
        assertThrows(IllegalArgumentException.class, () -> registry.rejectIncompleteUiActivation("ja"));
        assertThrows(IllegalArgumentException.class, () -> registry.rejectIncompleteUiActivation("th"));
    }

    @Test
    void migrationDoesNotRewriteLegacyAuditionTranslationsOrPayments() throws Exception {
        String sql = Files.readString(Path.of("src/main/resources/db/migration/V47__content_translation_engine.sql"));
        assertFalse(sql.contains("ALTER TABLE public.audition_translations"));
        assertFalse(sql.contains("UPDATE public.auditions"));
        assertFalse(sql.toLowerCase().contains("update public.credit_transactions"));
        assertFalse(sql.toLowerCase().contains("update public.payment_orders"));
        assertTrue(sql.contains("VARCHAR(35)"));
    }

    @Test
    void registryFileMatchesTheFrontendCatalog() throws Exception {
        String backend = Files.readString(Path.of("src/main/resources/i18n/locales.json"));
        String frontend = Files.readString(Path.of("../frontend/web/messages/locales.json"));
        assertEquals(frontend.trim(), backend.trim());
    }

    @Test
    void absentRequestUsesEnglishWithoutRelabelingStoredKorean() {
        ContentLocaleResolver resolver = new ContentLocaleResolver(new LocaleRegistry());
        assertEquals("en", resolver.resolve(null));
        assertEquals("ko", ContentLocales.canonicalTag("ko"));
    }
}
