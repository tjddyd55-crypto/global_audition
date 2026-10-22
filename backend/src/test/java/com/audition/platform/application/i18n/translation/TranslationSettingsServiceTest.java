package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.application.payment.SettingsSecretCrypto;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.i18n.PlatformTranslationSettings;
import com.audition.platform.domain.i18n.PlatformTranslationSettingsRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TranslationSettingsServiceTest {

    private PlatformTranslationSettingsRepository repository;
    private SettingsSecretCrypto crypto;
    private EndpointGuard guard;
    private TranslationSettingsService service;
    private PlatformTranslationSettings row;

    @BeforeEach
    void setUp() {
        repository = mock(PlatformTranslationSettingsRepository.class);
        crypto = mock(SettingsSecretCrypto.class);
        guard = mock(EndpointGuard.class);
        service = new TranslationSettingsService(repository, crypto, guard);
        row = new PlatformTranslationSettings();
        row.setId((short) 1);
        row.setEndpointUrl("https://api.openai.com/v1/chat/completions");
        row.setModel("gpt-6-luna");
        row.setApiKeyCipher("cipher-existing");
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(crypto.decrypt("cipher-existing")).thenReturn("sk-test-secret");
        when(guard.permits(row.getEndpointUrl())).thenReturn(true);
        when(guard.resolveForCall(row.getEndpointUrl())).thenReturn(
                new ResolvedEndpoint("api.openai.com", 443, "/v1/chat/completions", List.of()));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                UUID.randomUUID(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void blankApiKeyKeepsCipherAndViewOmitsSecret() {
        TranslationSettingsPatchRequest request = new TranslationSettingsPatchRequest();
        request.setModel("from-admin");
        request.setApiKey("   ");

        TranslationSettingsView view = service.update(request);

        assertEquals("cipher-existing", row.getApiKeyCipher());
        assertEquals("from-admin", view.getModel());
        assertTrue(view.isApiKeyConfigured());
        assertEquals(TranslationSettingsService.STATE_CONFIGURED, view.getState());
        verify(crypto, never()).encrypt(any());
        assertFalse(String.valueOf(view).contains("sk-test-secret"));
    }

    @Test
    void rejectedEndpointIsNotConfiguredAndDoesNotReplaceKey() {
        when(guard.permits("http://127.0.0.1/v1")).thenReturn(false);
        when(guard.resolveForCall("http://127.0.0.1/v1")).thenThrow(new TranslationProviderException(
                AuditionTranslation.ERROR_ENDPOINT_REJECTED,
                "번역 엔드포인트가 허용되지 않습니다."));
        row.setEndpointUrl("http://127.0.0.1/v1");

        TranslationSettingsView view = service.view();

        assertEquals(TranslationSettingsService.STATE_NOT_CONFIGURED, view.getState());
        assertFalse(service.loadRuntime().configured());

        TranslationSettingsPatchRequest request = new TranslationSettingsPatchRequest();
        request.setEndpointUrl("http://127.0.0.1/v1");
        request.setApiKey("sk-new-secret");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(request));
        assertEquals(400, ex.getStatusCode().value());
        assertEquals("cipher-existing", row.getApiKeyCipher());
        verify(crypto, never()).encrypt(any());
    }
}
