package com.audition.platform.application.payment;

import com.audition.platform.api.dto.payment.PaymentConnectionTestResult;
import com.audition.platform.api.dto.payment.PaymentSettingsPatchRequest;
import com.audition.platform.api.dto.payment.PaymentSettingsView;
import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.payment.PlatformPaymentSettings;
import com.audition.platform.domain.payment.PlatformPaymentSettingsRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentSettingsService {

    public static final String ENV_TEST = "TEST";
    public static final String ENV_LIVE = "LIVE";

    private final PlatformPaymentSettingsRepository repository;
    private final SettingsSecretCrypto crypto;
    private final AdminAuditLogService adminAuditLogService;
    private final TossPaymentsClient tossPaymentsClient;
    private final String envTestSecret;
    private final String envLiveSecret;

    public PaymentSettingsService(
            PlatformPaymentSettingsRepository repository,
            SettingsSecretCrypto crypto,
            AdminAuditLogService adminAuditLogService,
            TossPaymentsClient tossPaymentsClient,
            @Value("${TOSS_TEST_SECRET_KEY:}") String envTestSecret,
            @Value("${TOSS_LIVE_SECRET_KEY:}") String envLiveSecret) {
        this.repository = repository;
        this.crypto = crypto;
        this.adminAuditLogService = adminAuditLogService;
        this.tossPaymentsClient = tossPaymentsClient;
        this.envTestSecret = envTestSecret;
        this.envLiveSecret = envLiveSecret;
    }

    @Transactional
    public PlatformPaymentSettings requireRow() {
        return repository.findById((short) 1).orElseGet(() -> {
            PlatformPaymentSettings row = new PlatformPaymentSettings();
            row.setId((short) 1);
            row.setEnabled(false);
            row.setEnvironment(ENV_TEST);
            row.setCurrency(SettlementCurrency.CODE);
            row.setForeignCurrencyEnabled(false);
            row.setUpdatedAt(Instant.now());
            return repository.save(row);
        });
    }

    @Transactional(readOnly = true)
    public PaymentSettingsView view() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return toView(requireRow());
    }

    @Transactional
    public PaymentSettingsView update(PaymentSettingsPatchRequest req) {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformPaymentSettings row = requireRow();
        if (req.getEnabled() != null) {
            row.setEnabled(req.getEnabled());
        }
        if (req.getEnvironment() != null) {
            String env = req.getEnvironment().trim().toUpperCase(Locale.ROOT);
            if (!ENV_TEST.equals(env) && !ENV_LIVE.equals(env)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "environment는 TEST 또는 LIVE만 허용합니다.");
            }
            row.setEnvironment(env);
        }
        if (req.getCurrency() != null && !req.getCurrency().isBlank()) {
            row.setCurrency(SettlementCurrency.requireUsd(req.getCurrency()));
        } else {
            row.setCurrency(SettlementCurrency.CODE);
        }
        if (req.getTestClientKey() != null) {
            row.setTestClientKey(blankToNull(req.getTestClientKey()));
        }
        if (req.getLiveClientKey() != null) {
            row.setLiveClientKey(blankToNull(req.getLiveClientKey()));
        }
        if (req.getTestSecretKey() != null && !req.getTestSecretKey().isBlank()) {
            row.setTestSecretCipher(crypto.encrypt(req.getTestSecretKey().trim()));
        }
        if (req.getLiveSecretKey() != null && !req.getLiveSecretKey().isBlank()) {
            row.setLiveSecretCipher(crypto.encrypt(req.getLiveSecretKey().trim()));
        }
        if (req.getForeignCardKrw() != null) {
            row.setForeignCardKrw(req.getForeignCardKrw());
        }
        if (req.getForeignCurrencyEnabled() != null) {
            // 활성화는 리뷰 전까지 강제 OFF. 저장은 하되 LIVE 혼용 방지 플래그만 유지.
            row.setForeignCurrencyEnabled(Boolean.TRUE.equals(req.getForeignCurrencyEnabled()) && false);
        }
        if (req.getVariantKey() != null) {
            row.setVariantKey(blankToNull(req.getVariantKey()));
        }
        if (req.getMid() != null) {
            row.setMid(blankToNull(req.getMid()));
        }
        assertNoMixedKeys(row);
        if (row.isEnabled() && !isActivationComplete(row)) {
            if (Boolean.TRUE.equals(req.getEnabled())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "활성화하려면 해당 환경의 client/secret과 variantKey, MID가 필요합니다.");
            }
            row.setEnabled(false);
        }
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(SecurityUtils.getCurrentUserId());
        repository.save(row);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.PAYMENT_SETTINGS_PATCH,
                    "PAYMENT_SETTINGS",
                    "1",
                    Map.of(),
                    Map.of("enabled", row.isEnabled(), "environment", row.getEnvironment(), "currency", row.getCurrency()));
        }
        return toView(row);
    }

    public String requireActiveClientKey() {
        PlatformPaymentSettings row = requireRow();
        if (!row.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "토스 결제가 비활성화되어 있습니다.");
        }
        if (!isActivationComplete(row)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "variantKey/MID 또는 키가 없어 결제를 활성화할 수 없습니다.");
        }
        String key = ENV_LIVE.equals(row.getEnvironment()) ? row.getLiveClientKey() : row.getTestClientKey();
        if (key == null || key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성화된 환경의 클라이언트 키가 없습니다.");
        }
        return key.trim();
    }

    public String requireActiveSecret() {
        PlatformPaymentSettings row = requireRow();
        if (!row.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "토스 결제가 비활성화되어 있습니다.");
        }
        boolean live = ENV_LIVE.equals(row.getEnvironment());
        String envOverride = live ? envLiveSecret : envTestSecret;
        if (envOverride != null && !envOverride.isBlank()) {
            return envOverride.trim();
        }
        String cipher = live ? row.getLiveSecretCipher() : row.getTestSecretCipher();
        String secret = cipher == null ? null : crypto.decrypt(cipher);
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성화된 환경의 시크릿 키가 없습니다.");
        }
        assertClientSecretPair(row, secret);
        return secret;
    }

    public PlatformPaymentSettings current() {
        return requireRow();
    }

    @Transactional
    public PaymentConnectionTestResult testConnection() {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformPaymentSettings row = requireRow();
        if (!isActivationComplete(row)) {
            return new PaymentConnectionTestResult(
                    PaymentConnectionTestResult.CONFIG_INCOMPLETE, row.getEnvironment(), false);
        }
        String secret;
        try {
            secret = resolveSecretForProbe(row);
        } catch (ResponseStatusException e) {
            return new PaymentConnectionTestResult(
                    PaymentConnectionTestResult.CONFIG_INCOMPLETE, row.getEnvironment(), false);
        }
        TossPaymentsClient.ConnectionProbe probe = tossPaymentsClient.probeSecret(secret);
        boolean live = ENV_LIVE.equals(row.getEnvironment());
        String result = !probe.isValidKey()
                ? PaymentConnectionTestResult.INVALID_KEY
                : (live ? PaymentConnectionTestResult.LIVE_CONNECTED : PaymentConnectionTestResult.TEST_CONNECTED);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.PAYMENT_CONNECTION_TEST,
                    "PAYMENT_SETTINGS",
                    "1",
                    Map.of(),
                    Map.of("result", result, "environment", row.getEnvironment()));
        }
        return new PaymentConnectionTestResult(result, row.getEnvironment(), probe.isValidKey());
    }

    private String resolveSecretForProbe(PlatformPaymentSettings row) {
        boolean live = ENV_LIVE.equals(row.getEnvironment());
        String envOverride = live ? envLiveSecret : envTestSecret;
        if (envOverride != null && !envOverride.isBlank()) {
            return envOverride.trim();
        }
        String cipher = live ? row.getLiveSecretCipher() : row.getTestSecretCipher();
        String secret = cipher == null ? null : crypto.decrypt(cipher);
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "활성화된 환경의 시크릿 키가 없습니다.");
        }
        return secret;
    }

    private void assertNoMixedKeys(PlatformPaymentSettings row) {
        String testClient = row.getTestClientKey();
        String liveClient = row.getLiveClientKey();
        String testSecret = firstNonBlank(envTestSecret, decryptQuiet(row.getTestSecretCipher()));
        String liveSecret = firstNonBlank(envLiveSecret, decryptQuiet(row.getLiveSecretCipher()));
        if (testClient != null && testSecret != null && looksLive(testClient) != looksLive(testSecret)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEST 클라이언트와 LIVE 시크릿을 섞을 수 없습니다.");
        }
        if (liveClient != null && liveSecret != null && looksLive(liveClient) != looksLive(liveSecret)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEST 클라이언트와 LIVE 시크릿을 섞을 수 없습니다.");
        }
        if (ENV_LIVE.equals(row.getEnvironment()) && testSecret != null && looksLive(testSecret) && liveSecret == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LIVE 환경에는 LIVE 시크릿이 필요합니다.");
        }
    }

    private static boolean looksLive(String key) {
        return key != null && key.contains("live_");
    }

    private void assertClientSecretPair(PlatformPaymentSettings row, String secret) {
        String client = ENV_LIVE.equals(row.getEnvironment()) ? row.getLiveClientKey() : row.getTestClientKey();
        if (client == null || secret == null) {
            return;
        }
        boolean clientLive = client.contains("live_");
        boolean secretLive = secret.contains("live_");
        if (clientLive != secretLive) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "TEST 클라이언트와 LIVE 시크릿을 섞을 수 없습니다.");
        }
    }

    private PaymentSettingsView toView(PlatformPaymentSettings row) {
        PaymentSettingsView view = new PaymentSettingsView();
        view.setEnabled(row.isEnabled());
        view.setEnvironment(row.getEnvironment());
        view.setCurrency(row.getCurrency());
        view.setTestClientKey(row.getTestClientKey());
        view.setLiveClientKey(row.getLiveClientKey());
        String testSecret = firstNonBlank(envTestSecret, decryptQuiet(row.getTestSecretCipher()));
        String liveSecret = firstNonBlank(envLiveSecret, decryptQuiet(row.getLiveSecretCipher()));
        view.setTestSecretConfigured(testSecret != null);
        view.setLiveSecretConfigured(liveSecret != null);
        view.setTestSecretMasked(SettingsSecretCrypto.maskSecret(testSecret));
        view.setLiveSecretMasked(SettingsSecretCrypto.maskSecret(liveSecret));
        view.setForeignCardKrw(row.isForeignCardKrw());
        view.setForeignCurrencyEnabled(row.isForeignCurrencyEnabled());
        view.setVariantKey(row.getVariantKey());
        view.setMid(row.getMid());
        view.setUpdatedAt(row.getUpdatedAt());
        view.setTossMethod(SettlementCurrency.TOSS_METHOD);
        view.setForeignEasyPayProvider(SettlementCurrency.TOSS_EASY_PAY_PROVIDER);
        view.setActivationReady(isActivationComplete(row));
        return view;
    }

    boolean isActivationComplete(PlatformPaymentSettings row) {
        if (row.getVariantKey() == null || row.getVariantKey().isBlank()) {
            return false;
        }
        if (row.getMid() == null || row.getMid().isBlank()) {
            return false;
        }
        boolean live = ENV_LIVE.equals(row.getEnvironment());
        String client = live ? row.getLiveClientKey() : row.getTestClientKey();
        if (client == null || client.isBlank()) {
            return false;
        }
        String secret = firstNonBlank(live ? envLiveSecret : envTestSecret,
                decryptQuiet(live ? row.getLiveSecretCipher() : row.getTestSecretCipher()));
        return secret != null && !secret.isBlank();
    }

    private String decryptQuiet(String cipher) {
        if (cipher == null || cipher.isBlank()) {
            return null;
        }
        try {
            return crypto.decrypt(cipher);
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a.trim();
        }
        return b;
    }

    private static String blankToNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }
}
