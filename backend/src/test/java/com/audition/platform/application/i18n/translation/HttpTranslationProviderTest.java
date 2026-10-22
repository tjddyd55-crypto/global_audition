package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HttpTranslationProviderTest {

    private TranslationSettingsService settings;
    private TranslationHttpTransport transport;
    private HttpTranslationProvider provider;

    @BeforeEach
    void setUp() {
        settings = mock(TranslationSettingsService.class);
        transport = mock(TranslationHttpTransport.class);
        provider = new HttpTranslationProvider(settings, transport, new ObjectMapper());
    }

    @Test
    void notConfiguredDoesNotCallNetworkOrInventText() {
        when(settings.loadRuntime()).thenReturn(new TranslationRuntime("OPENAI_COMPATIBLE", "", "", "", false));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate(source(), "en"));

        assertEquals(AuditionTranslation.ERROR_NOT_CONFIGURED, ex.getErrorCode());
        verify(transport, never()).postJson(any(), any(), any());
    }

    @Test
    void parsesProviderJson() {
        when(settings.loadRuntime()).thenReturn(new TranslationRuntime(
                "OPENAI_COMPATIBLE",
                "https://api.example.com/v1/chat/completions",
                "gpt-test",
                "server-side-key",
                true));
        when(transport.postJson(any(), any(), any())).thenReturn(new TranslationHttpResult(
                200,
                "{\"choices\":[{\"message\":{\"content\":\"{\\\"title\\\":\\\"Hello\\\",\\\"description\\\":\\\"Body\\\",\\\"location\\\":\\\"Seoul\\\",\\\"agencyName\\\":\\\"Agency\\\",\\\"recruitFields\\\":[\\\"Vocal\\\"],\\\"qualifications\\\":[],\\\"schedules\\\":[],\\\"benefits\\\":[]}\"}}]}"));

        TranslationDraft draft = provider.translate(source(), "en");

        assertEquals("Hello", draft.title());
        assertEquals(List.of("Vocal"), draft.recruitFields());
    }

    private static TranslationSource source() {
        return new TranslationSource("ko", "안녕", "", "", "", List.of(), List.of(), List.of(), List.of());
    }
}
