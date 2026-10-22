package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JdkTranslationHttpTransportTest {

    @Test
    void redirectResponseIsRejectedWithoutItsLocation() {
        String raw = "HTTP/1.1 302 Found\r\nLocation: http://169.254.169.254/latest/meta-data\r\nContent-Length: 0\r\n\r\n";

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> JdkTranslationHttpTransport.readHttpResponse(new ByteArrayInputStream(raw.getBytes(StandardCharsets.ISO_8859_1))));

        assertEquals(AuditionTranslation.ERROR_HTTP, ex.getErrorCode());
        assertFalse(ex.getMessage().contains("169.254"));
        assertFalse(ex.getMessage().contains("meta-data"));
    }

    @Test
    void httpErrorDoesNotIncludeBody() {
        String raw = "HTTP/1.1 500 Error\r\nContent-Length: 18\r\n\r\nsk-live-secret-body";

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> JdkTranslationHttpTransport.readHttpResponse(new ByteArrayInputStream(raw.getBytes(StandardCharsets.ISO_8859_1))));

        assertEquals(AuditionTranslation.ERROR_HTTP, ex.getErrorCode());
        assertFalse(ex.getMessage().contains("sk-"));
    }

    @Test
    void callResolvesBeforeConnectAndDoesNotOpenSocketWhenRejected() {
        EndpointGuard guard = mock(EndpointGuard.class);
        when(guard.resolveForCall("https://api.openai.com/v1/chat/completions"))
                .thenThrow(new TranslationProviderException(
                        AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                        "번역 엔드포인트가 허용되지 않습니다."));
        JdkTranslationHttpTransport transport = new JdkTranslationHttpTransport(guard);

        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> transport.postJson(
                        "https://api.openai.com/v1/chat/completions",
                        "server-side-key",
                        "{}"));

        assertEquals(AuditionTranslation.ERROR_ENDPOINT_REJECTED, ex.getErrorCode());
    }
}
