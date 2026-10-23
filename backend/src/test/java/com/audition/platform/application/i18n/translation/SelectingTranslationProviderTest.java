package com.audition.platform.application.i18n.translation;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SelectingTranslationProviderTest {

    @Test
    void googleIsTheDefaultAndOpenAiRemainsSelectable() {
        TranslationSettingsService settings = mock(TranslationSettingsService.class);
        GoogleCloudTranslationProvider google = mock(GoogleCloudTranslationProvider.class);
        HttpTranslationProvider openAi = mock(HttpTranslationProvider.class);
        when(google.providerId()).thenReturn(GoogleCloudTranslationProvider.PROVIDER_ID);
        when(openAi.providerId()).thenReturn(HttpTranslationProvider.PROVIDER_ID);
        when(google.isConfigured()).thenReturn(false);
        when(settings.activeProviderId()).thenReturn(GoogleCloudTranslationProvider.PROVIDER_ID);
        SelectingTranslationProvider selector = new SelectingTranslationProvider(settings, google, openAi);

        assertEquals(GoogleCloudTranslationProvider.PROVIDER_ID, selector.providerId());
        assertFalse(selector.isConfigured());

        when(settings.activeProviderId()).thenReturn(HttpTranslationProvider.PROVIDER_ID);
        TranslationDocumentDraft expected = new TranslationDocumentDraft(Map.of("introText", "hello"), null);
        when(openAi.translateDocument("ko", Map.of("introText", "안녕"), "en")).thenReturn(expected);
        assertEquals("hello", selector.translateDocument("ko", Map.of("introText", "안녕"), "en").fields().get("introText"));
        verify(openAi).translateDocument("ko", Map.of("introText", "안녕"), "en");
    }
}
