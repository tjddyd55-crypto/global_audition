package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.payment.SettingsSecretCrypto;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.i18n.PlatformTranslationSettings;
import com.audition.platform.domain.i18n.PlatformTranslationSettingsRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class TranslationSettingsService {

    public static final String STATE_CONFIGURED = "CONFIGURED";
    public static final String STATE_NOT_CONFIGURED = "NOT_CONFIGURED";

    private final PlatformTranslationSettingsRepository repository;
    private final SettingsSecretCrypto crypto;
    private final EndpointGuard endpointGuard;

    public TranslationSettingsService(
            PlatformTranslationSettingsRepository repository,
            SettingsSecretCrypto crypto,
            EndpointGuard endpointGuard) {
        this.repository = repository;
        this.crypto = crypto;
        this.endpointGuard = endpointGuard;
    }

    @Transactional
    public PlatformTranslationSettings requireRow() {
        return repository.findById((short) 1).orElseGet(this::insertEmptyRow);
    }

    @Transactional(readOnly = true)
    public TranslationRuntime loadRuntime() {
        PlatformTranslationSettings row = repository.findById((short) 1).orElse(null);
        if (row == null) {
            return unconfigured();
        }
        String key = decryptQuietly(row.getApiKeyCipher());
        boolean configured = endpointAllowed(row.getEndpointUrl()) && hasText(row.getModel()) && hasText(key);
        return new TranslationRuntime(
                HttpTranslationProvider.PROVIDER_ID,
                blankToEmpty(row.getEndpointUrl()),
                blankToEmpty(row.getModel()),
                key == null ? "" : key,
                configured);
    }

    @Transactional(readOnly = true)
    public TranslationSettingsView view() {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformTranslationSettings row = repository.findById((short) 1).orElse(null);
        if (row == null) {
            TranslationSettingsView empty = new TranslationSettingsView();
            empty.setProvider(HttpTranslationProvider.PROVIDER_ID);
            empty.setState(STATE_NOT_CONFIGURED);
            return empty;
        }
        return toView(row);
    }

    @Transactional
    public TranslationSettingsView update(TranslationSettingsPatchRequest request) {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformTranslationSettings row = requireRow();
        if (request.getEndpointUrl() != null) {
            String next = blankToNull(request.getEndpointUrl());
            if (next != null) {
                try {
                    endpointGuard.resolveForCall(next);
                } catch (TranslationProviderException ex) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, AuditionTranslation.ERROR_ENDPOINT_REJECTED);
                }
            }
            row.setEndpointUrl(next);
        }
        if (request.getModel() != null) {
            row.setModel(blankToNull(request.getModel()));
        }
        if (request.getApiKey() != null && !request.getApiKey().isBlank()) {
            row.setApiKeyCipher(crypto.encrypt(request.getApiKey().trim()));
        }
        row.setProvider(HttpTranslationProvider.PROVIDER_ID);
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(SecurityUtils.getCurrentUserId());
        return toView(repository.save(row));
    }

    private PlatformTranslationSettings insertEmptyRow() {
        PlatformTranslationSettings row = new PlatformTranslationSettings();
        row.setId((short) 1);
        row.setProvider(HttpTranslationProvider.PROVIDER_ID);
        row.setUpdatedAt(Instant.now());
        return repository.save(row);
    }

    private TranslationSettingsView toView(PlatformTranslationSettings row) {
        TranslationRuntime runtime = describe(row);
        TranslationSettingsView view = new TranslationSettingsView();
        view.setProvider(runtime.providerId());
        view.setEndpointUrl(blankToNull(row.getEndpointUrl()));
        view.setModel(blankToNull(row.getModel()));
        view.setApiKeyConfigured(hasText(runtime.apiKey()));
        view.setState(runtime.configured() ? STATE_CONFIGURED : STATE_NOT_CONFIGURED);
        return view;
    }

    private TranslationRuntime describe(PlatformTranslationSettings row) {
        String key = decryptQuietly(row.getApiKeyCipher());
        boolean configured = endpointAllowed(row.getEndpointUrl()) && hasText(row.getModel()) && hasText(key);
        return new TranslationRuntime(
                HttpTranslationProvider.PROVIDER_ID,
                blankToEmpty(row.getEndpointUrl()),
                blankToEmpty(row.getModel()),
                key == null ? "" : key,
                configured);
    }

    private String decryptQuietly(String cipher) {
        if (cipher == null || cipher.isBlank()) {
            return null;
        }
        try {
            return crypto.decrypt(cipher);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private static TranslationRuntime unconfigured() {
        return new TranslationRuntime(HttpTranslationProvider.PROVIDER_ID, "", "", "", false);
    }

    private boolean endpointAllowed(String url) {
        return hasText(url) && endpointGuard.permits(url);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
