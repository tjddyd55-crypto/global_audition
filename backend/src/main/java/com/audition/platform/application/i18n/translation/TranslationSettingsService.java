package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.api.dto.TranslationUsageView;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.payment.SettingsSecretCrypto;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.audition.platform.domain.i18n.PlatformTranslationSettings;
import com.audition.platform.domain.i18n.PlatformTranslationSettingsRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class TranslationSettingsService {

    public static final String STATE_CONFIGURED = "CONFIGURED";
    public static final String STATE_NOT_CONFIGURED = "NOT_CONFIGURED";

    private static final Pattern PROJECT_ID = Pattern.compile("^[a-z][a-z0-9-]{4,28}[a-z0-9]$");
    private static final Pattern LOCATION = Pattern.compile("^global$|^[a-z]+(?:-[a-z0-9]+)+$");
    private static final Pattern MODEL = Pattern.compile("^[A-Za-z0-9._-]{1,40}(?:/[A-Za-z0-9._-]{1,40})?$");

    private final PlatformTranslationSettingsRepository repository;
    private final SettingsSecretCrypto crypto;
    private final EndpointGuard endpointGuard;
    private final GoogleTranslationProperties googleProperties;
    private final JdbcTemplate jdbc;

    public TranslationSettingsService(
            PlatformTranslationSettingsRepository repository,
            SettingsSecretCrypto crypto,
            EndpointGuard endpointGuard,
            GoogleTranslationProperties googleProperties,
            JdbcTemplate jdbc) {
        this.repository = repository;
        this.crypto = crypto;
        this.endpointGuard = endpointGuard;
        this.googleProperties = googleProperties;
        this.jdbc = jdbc;
    }

    @Transactional
    public PlatformTranslationSettings requireRow() {
        return repository.findById((short) 1).orElseGet(this::insertEmptyRow);
    }

    /** OpenAI 호환 공급자 런타임. 활성 공급자 선택과 분리되어 있다. */
    @Transactional(readOnly = true)
    public TranslationRuntime loadRuntime() {
        return loadOpenAi(repository.findById((short) 1).orElse(null));
    }

    @Transactional(readOnly = true)
    public GoogleRuntime loadGoogleRuntime() {
        return describeGoogle(repository.findById((short) 1).orElse(null));
    }

    @Transactional(readOnly = true)
    public String activeProviderId() {
        PlatformTranslationSettings row = repository.findById((short) 1).orElse(null);
        if (row == null || row.getActiveProvider() == null || row.getActiveProvider().isBlank()) {
            return GoogleCloudTranslationProvider.PROVIDER_ID;
        }
        return row.getActiveProvider();
    }

    @Transactional(readOnly = true)
    public long effectiveGoogleCharacterRate() {
        PlatformTranslationSettings row = repository.findById((short) 1).orElse(null);
        if (row != null && row.getGoogleCostMicroUsdPerMillion() != null) {
            return row.getGoogleCostMicroUsdPerMillion();
        }
        return googleProperties.getMicroUsdPerMillionCharacters();
    }

    @Transactional(readOnly = true)
    public TranslationSettingsView view() {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformTranslationSettings row = repository.findById((short) 1).orElse(null);
        if (row == null) {
            TranslationSettingsView empty = new TranslationSettingsView();
            empty.setProvider(GoogleCloudTranslationProvider.PROVIDER_ID);
            empty.setActiveProvider(GoogleCloudTranslationProvider.PROVIDER_ID);
            empty.setState(STATE_NOT_CONFIGURED);
            empty.setOpenAiState(STATE_NOT_CONFIGURED);
            empty.setGoogleState(STATE_NOT_CONFIGURED);
            empty.setEffectiveGoogleMicroUsdPerMillion(googleProperties.getMicroUsdPerMillionCharacters());
            return empty;
        }
        return toView(row);
    }

    @Transactional
    public TranslationSettingsView update(TranslationSettingsPatchRequest request) {
        SuperAdminAuthHelper.requireSuperAdmin();
        PlatformTranslationSettings row = requireRow();
        String endpoint = request.getEndpointUrl() == null ? row.getEndpointUrl() : blankToNull(request.getEndpointUrl());
        if (request.getEndpointUrl() != null && endpoint != null) {
            try {
                endpointGuard.resolveForCall(endpoint);
            } catch (TranslationProviderException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, AuditionTranslation.ERROR_ENDPOINT_REJECTED);
            }
        }
        String project = request.getGoogleProjectId() == null
                ? row.getGoogleProjectId() : blankToNull(request.getGoogleProjectId());
        if (project != null && !PROJECT_ID.matcher(project).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_PROJECT");
        }
        String location = request.getGoogleLocation() == null
                ? row.getGoogleLocation() : blankToNull(request.getGoogleLocation());
        if (location != null && !LOCATION.matcher(location).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_LOCATION");
        }
        String googleModel = request.getGoogleModel() == null
                ? row.getGoogleModel() : blankToNull(request.getGoogleModel());
        if (googleModel != null && !MODEL.matcher(googleModel).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_MODEL");
        }
        String active = request.getActiveProvider() == null
                ? activeOrDefault(row) : request.getActiveProvider().trim();
        if (!GoogleCloudTranslationProvider.PROVIDER_ID.equals(active)
                && !HttpTranslationProvider.PROVIDER_ID.equals(active)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_PROVIDER");
        }
        Long cost = request.getGoogleCostMicroUsdPerMillion() == null
                ? row.getGoogleCostMicroUsdPerMillion() : request.getGoogleCostMicroUsdPerMillion();
        if (cost != null && cost < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_COST_RATE");
        }
        String googleCipher = row.getGoogleCredentialsCipher();
        if (request.getGoogleCredentialsJson() != null && !request.getGoogleCredentialsJson().isBlank()) {
            try {
                GoogleServiceAccount.parse(request.getGoogleCredentialsJson());
            } catch (TranslationProviderException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, AuditionTranslation.ERROR_INVALID_CREDENTIALS);
            }
            googleCipher = crypto.encrypt(request.getGoogleCredentialsJson().trim());
        }
        if (request.getEndpointUrl() != null) {
            row.setEndpointUrl(endpoint);
        }
        if (request.getModel() != null) {
            row.setModel(blankToNull(request.getModel()));
        }
        if (request.getApiKey() != null && !request.getApiKey().isBlank()) {
            row.setApiKeyCipher(crypto.encrypt(request.getApiKey().trim()));
        }
        if (request.getGoogleProjectId() != null) {
            row.setGoogleProjectId(project);
        }
        if (request.getGoogleLocation() != null) {
            row.setGoogleLocation(location);
        }
        if (request.getGoogleModel() != null) {
            row.setGoogleModel(googleModel);
        }
        if (request.getActiveProvider() != null) {
            row.setActiveProvider(active);
        }
        if (request.getGoogleCostMicroUsdPerMillion() != null) {
            row.setGoogleCostMicroUsdPerMillion(cost);
        }
        row.setGoogleCredentialsCipher(googleCipher);
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(SecurityUtils.getCurrentUserId());
        return toView(repository.save(row));
    }

    @Transactional(readOnly = true)
    public TranslationUsageView monthlyUsage(String month) {
        SuperAdminAuthHelper.requireSuperAdmin();
        YearMonth period;
        if (month == null || month.isBlank()) {
            period = YearMonth.now(ZoneOffset.UTC);
        } else {
            try {
                period = YearMonth.parse(month.trim());
            } catch (RuntimeException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_MONTH");
            }
        }
        Instant start = period.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant end = period.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT COALESCE(provider, '') AS provider,
                       COUNT(*) AS attempts,
                       COALESCE(SUM(billed_characters), 0) AS billed_characters,
                       COALESCE(SUM(estimated_cost_micro_usd), 0) AS estimated_cost_micro_usd
                FROM content_translation_attempts
                WHERE started_at >= ? AND started_at < ?
                GROUP BY provider
                ORDER BY provider
                """, Timestamp.from(start), Timestamp.from(end));
        TranslationUsageView view = new TranslationUsageView();
        view.setMonth(period.toString());
        for (Map<String, Object> row : rows) {
            TranslationUsageView.TranslationUsageSlice slice = new TranslationUsageView.TranslationUsageSlice();
            slice.setProvider(String.valueOf(row.get("provider")));
            slice.setAttempts(number(row.get("attempts")));
            slice.setBilledCharacters(number(row.get("billed_characters")));
            slice.setEstimatedCostMicroUsd(number(row.get("estimated_cost_micro_usd")));
            view.getProviders().add(slice);
            view.setAttempts(view.getAttempts() + slice.getAttempts());
            view.setBilledCharacters(view.getBilledCharacters() + slice.getBilledCharacters());
            view.setEstimatedCostMicroUsd(view.getEstimatedCostMicroUsd() + slice.getEstimatedCostMicroUsd());
        }
        return view;
    }

    private PlatformTranslationSettings insertEmptyRow() {
        PlatformTranslationSettings row = new PlatformTranslationSettings();
        row.setId((short) 1);
        row.setProvider(HttpTranslationProvider.PROVIDER_ID);
        row.setActiveProvider(GoogleCloudTranslationProvider.PROVIDER_ID);
        row.setUpdatedAt(Instant.now());
        return repository.save(row);
    }

    private TranslationSettingsView toView(PlatformTranslationSettings row) {
        TranslationRuntime openAi = loadOpenAi(row);
        GoogleRuntime google = describeGoogle(row);
        String active = activeOrDefault(row);
        TranslationSettingsView view = new TranslationSettingsView();
        view.setProvider(active);
        view.setActiveProvider(active);
        view.setEndpointUrl(blankToNull(row.getEndpointUrl()));
        view.setModel(blankToNull(row.getModel()));
        view.setApiKeyConfigured(hasText(openAi.apiKey()));
        view.setOpenAiState(openAi.configured() ? STATE_CONFIGURED : STATE_NOT_CONFIGURED);
        view.setGoogleProjectId(blankToNull(row.getGoogleProjectId()));
        view.setGoogleLocation(blankToNull(row.getGoogleLocation()));
        view.setGoogleModel(blankToNull(row.getGoogleModel()));
        view.setGoogleCredentialsConfigured(google.configured() || hasText(decryptQuietly(row.getGoogleCredentialsCipher())));
        view.setGoogleState(google.configured() ? STATE_CONFIGURED : STATE_NOT_CONFIGURED);
        view.setGoogleCostMicroUsdPerMillion(row.getGoogleCostMicroUsdPerMillion());
        view.setEffectiveGoogleMicroUsdPerMillion(row.getGoogleCostMicroUsdPerMillion() != null
                ? row.getGoogleCostMicroUsdPerMillion()
                : googleProperties.getMicroUsdPerMillionCharacters());
        boolean activeConfigured = GoogleCloudTranslationProvider.PROVIDER_ID.equals(active)
                ? google.configured() : openAi.configured();
        view.setState(activeConfigured ? STATE_CONFIGURED : STATE_NOT_CONFIGURED);
        return view;
    }

    private TranslationRuntime loadOpenAi(PlatformTranslationSettings row) {
        if (row == null) {
            return new TranslationRuntime(HttpTranslationProvider.PROVIDER_ID, "", "", "", false);
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

    private GoogleRuntime describeGoogle(PlatformTranslationSettings row) {
        if (row == null) {
            return new GoogleRuntime("", "", "", null, false);
        }
        String json = decryptQuietly(row.getGoogleCredentialsCipher());
        boolean parsed = false;
        if (hasText(json)) {
            try {
                GoogleServiceAccount.parse(json);
                parsed = true;
            } catch (RuntimeException ex) {
                parsed = false;
            }
        }
        boolean configured = parsed && hasText(row.getGoogleProjectId()) && hasText(row.getGoogleLocation());
        return new GoogleRuntime(
                blankToEmpty(row.getGoogleProjectId()),
                blankToEmpty(row.getGoogleLocation()),
                blankToEmpty(row.getGoogleModel()),
                configured ? json : null,
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

    private static String activeOrDefault(PlatformTranslationSettings row) {
        if (row.getActiveProvider() == null || row.getActiveProvider().isBlank()) {
            return GoogleCloudTranslationProvider.PROVIDER_ID;
        }
        return row.getActiveProvider();
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

    private static long number(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }
}
