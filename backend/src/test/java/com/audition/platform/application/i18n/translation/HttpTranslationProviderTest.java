package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
        org.mockito.ArgumentCaptor<String> body = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(transport).postJson(any(), org.mockito.ArgumentMatchers.eq("server-side-key"), body.capture());
        assertTrue(body.getValue().contains("\"model\":\"gpt-test\""));
        assertFalse(body.getValue().contains("gpt-6-luna"));
    }

    @Test
    void httpErrorDoesNotExposeResponseBody() {
        when(settings.loadRuntime()).thenReturn(configured());
        when(transport.postJson(any(), any(), any())).thenReturn(new TranslationHttpResult(
                400,
                "{\"error\":\"sk-live-secret\",\"apiKey\":\"should-not-leak\"}"));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate(source(), "en"));

        assertEquals(AuditionTranslation.ERROR_HTTP, ex.getErrorCode());
        assertEquals(false, ex.getMessage().contains("sk-"));
        assertEquals(false, ex.getMessage().contains("should-not-leak"));
        verify(transport, times(1)).postJson(any(), any(), any());
    }

    @Test
    void redirectIsNotFollowed() {
        when(settings.loadRuntime()).thenReturn(configured());
        when(transport.postJson(any(), any(), any())).thenReturn(new TranslationHttpResult(
                302,
                "Location: http://169.254.169.254/latest/meta-data"));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate(source(), "en"));

        assertEquals(AuditionTranslation.ERROR_HTTP, ex.getErrorCode());
        assertEquals(false, ex.getMessage().contains("169.254"));
        verify(transport, times(1)).postJson(any(), any(), any());
    }

    @Test
    void malformedJsonIsDistinctFromACompletedDraft() {
        when(settings.loadRuntime()).thenReturn(configured());
        when(transport.postJson(any(), any(), any())).thenReturn(new TranslationHttpResult(200, "not-json"));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate(source(), "en"));

        assertEquals(AuditionTranslation.ERROR_MALFORMED_JSON, ex.getErrorCode());
    }

    @Test
    void timeoutCodeIsPreserved() {
        when(settings.loadRuntime()).thenReturn(configured());
        when(transport.postJson(any(), any(), any())).thenThrow(new TranslationProviderException(
                AuditionTranslation.ERROR_TIMEOUT,
                "번역 공급자 응답 시간이 초과되었습니다."));

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translate(source(), "en"));

        assertEquals(AuditionTranslation.ERROR_TIMEOUT, ex.getErrorCode());
    }

    private static TranslationRuntime configured() {
        return new TranslationRuntime(
                "OPENAI_COMPATIBLE",
                "https://api.openai.com/v1/chat/completions",
                "from-settings",
                "server-side-key",
                true);
    }

    private static TranslationSource source() {
        return new TranslationSource("ko", "안녕", "", "", "", List.of(), List.of(), List.of(), List.of());
    }
}
