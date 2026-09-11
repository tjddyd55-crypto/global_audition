package com.audition.platform.application.payment;

import com.audition.platform.api.dto.payment.PaymentConnectionTestResult;
import com.audition.platform.api.dto.payment.PaymentSettingsPatchRequest;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.domain.payment.PlatformPaymentSettings;
import com.audition.platform.domain.payment.PlatformPaymentSettingsRepository;
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
import static org.mockito.Mockito.when;

class PaymentSettingsServiceTest {

    private PlatformPaymentSettingsRepository repository;
    private SettingsSecretCrypto crypto;
    private TossPaymentsClient tossClient;
    private PaymentSettingsService service;

    @BeforeEach
    void setUp() {
        repository = mock(PlatformPaymentSettingsRepository.class);
        crypto = new SettingsSecretCrypto("unit-test-jwt-secret-for-aes-key");
        tossClient = mock(TossPaymentsClient.class);
        service = new PaymentSettingsService(
                repository,
                crypto,
                mock(AdminAuditLogService.class),
                tossClient,
                "",
                "");
        UUID adminId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        adminId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void activationIsOffWithoutVariantKeyAndMid() {
        PlatformPaymentSettings row = baseRow();
        row.setTestClientKey("test_ck_demo");
        row.setTestSecretCipher(crypto.encrypt("test_sk_demoABCD"));
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));

        assertFalse(service.isActivationComplete(row));
    }

    @Test
    void rejectsMixedTestClientAndLiveSecret() {
        PlatformPaymentSettings row = baseRow();
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentSettingsPatchRequest req = new PaymentSettingsPatchRequest();
        req.setTestClientKey("test_ck_demo");
        req.setTestSecretKey("live_gsk_shouldNotMixABCD");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(req));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void enablingWithoutCompleteConfigIsRejected() {
        PlatformPaymentSettings row = baseRow();
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PaymentSettingsPatchRequest req = new PaymentSettingsPatchRequest();
        req.setEnabled(true);
        req.setTestClientKey("test_ck_demo");
        req.setTestSecretKey("test_sk_demoABCD");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.update(req));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void connectionTestReturnsConfigIncompleteWhenKeysMissing() {
        PlatformPaymentSettings row = baseRow();
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));

        PaymentConnectionTestResult result = service.testConnection();
        assertEquals(PaymentConnectionTestResult.CONFIG_INCOMPLETE, result.getResult());
        assertFalse(result.isConnected());
    }

    @Test
    void connectionTestReportsTestConnectedWithoutCharging() {
        PlatformPaymentSettings row = completeTestRow();
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));
        when(tossClient.probeSecret(any())).thenReturn(TossPaymentsClient.ConnectionProbe.connected());

        PaymentConnectionTestResult result = service.testConnection();
        assertEquals(PaymentConnectionTestResult.TEST_CONNECTED, result.getResult());
        assertTrue(result.isConnected());
    }

    @Test
    void masksSecretsOnView() {
        PlatformPaymentSettings row = completeTestRow();
        when(repository.findById((short) 1)).thenReturn(Optional.of(row));

        String masked = service.view().getTestSecretMasked();
        assertTrue(masked != null && masked.contains("****"));
        assertFalse(masked.contains("demo"));
    }

    private PlatformPaymentSettings completeTestRow() {
        PlatformPaymentSettings row = baseRow();
        row.setTestClientKey("test_ck_demo");
        row.setTestSecretCipher(crypto.encrypt("test_sk_demoABCD"));
        row.setVariantKey("variant-test");
        row.setMid("mid-test");
        return row;
    }

    private static PlatformPaymentSettings baseRow() {
        PlatformPaymentSettings row = new PlatformPaymentSettings();
        row.setId((short) 1);
        row.setEnabled(false);
        row.setEnvironment(PaymentSettingsService.ENV_TEST);
        row.setCurrency("USD");
        return row;
    }
}
