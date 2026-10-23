package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationProbeView;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cloud Translation Advanced v3. 서비스 계정 OAuth 토큰으로 translateText 를 호출한다.
 * IAM 은 roles/cloudtranslate.user. API 키는 받지 않는다.
 * 모델 기본값은 general/nmt 이다.
 */
@Component
public class GoogleCloudTranslationProvider implements TranslationProvider {

    public static final String PROVIDER_ID = "GOOGLE_CLOUD_TRANSLATION";
    static final String TRANSLATE_HOST = "https://translate.googleapis.com";
    static final String DEFAULT_MODEL = "general/nmt";

    private static final Logger log = LoggerFactory.getLogger(GoogleCloudTranslationProvider.class);

    private final TranslationSettingsService settingsService;
    private final TranslationHttpTransport transport;
    private final GoogleAccessTokenClient tokens;
    private final ObjectMapper objectMapper;

    public GoogleCloudTranslationProvider(
            TranslationSettingsService settingsService,
            TranslationHttpTransport transport,
            GoogleAccessTokenClient tokens,
            ObjectMapper objectMapper) {
        this.settingsService = settingsService;
        this.transport = transport;
        this.tokens = tokens;
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerId() {
        return PROVIDER_ID;
    }

    @Override
    public boolean isConfigured() {
        return settingsService.loadGoogleRuntime().configured();
    }

    @Override
    public TranslationDraft translate(TranslationSource source, String targetLocale) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("title", text(source.title()));
        fields.put("description", text(source.description()));
        fields.put("location", text(source.location()));
        fields.put("agencyName", text(source.agencyName()));
        putList(fields, "recruitFields", source.recruitFields());
        putList(fields, "qualifications", source.qualifications());
        putList(fields, "schedules", source.schedules());
        putList(fields, "benefits", source.benefits());
        TranslationDocumentDraft document = translateDocument(source.sourceLocale(), fields, targetLocale);
        TranslationDraft draft = new TranslationDraft(
                document.fields().getOrDefault("title", ""),
                document.fields().getOrDefault("description", ""),
                document.fields().getOrDefault("location", ""),
                document.fields().getOrDefault("agencyName", ""),
                readList(document.fields(), "recruitFields", size(source.recruitFields())),
                readList(document.fields(), "qualifications", size(source.qualifications())),
                readList(document.fields(), "schedules", size(source.schedules())),
                readList(document.fields(), "benefits", size(source.benefits())));
        TranslationDraftValidator.validate(source, draft);
        return draft;
    }

    @Override
    public TranslationDocumentDraft translateDocument(String sourceLocale, Map<String, String> fields, String targetLocale) {
        Map<String, String> source = fields == null ? Map.of() : fields;
        List<String> keys = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<List<String>> masks = new ArrayList<>();
        for (Map.Entry<String, String> entry : source.entrySet()) {
            String value = entry.getValue() == null ? "" : entry.getValue();
            if (value.isBlank()) {
                continue;
            }
            List<String> captured = new ArrayList<>();
            keys.add(entry.getKey());
            contents.add(PlainTextProtector.protect(value, captured));
            masks.add(captured);
        }
        Map<String, String> result = new LinkedHashMap<>();
        for (String key : source.keySet()) {
            String value = source.get(key);
            result.put(key, value == null || value.isBlank() ? "" : null);
        }
        if (contents.isEmpty()) {
            return new TranslationDocumentDraft(Map.copyOf(result), null);
        }
        List<String> translated = translateContents(sourceLocale, targetLocale, contents);
        if (translated.size() != contents.size()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH,
                    AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH);
        }
        for (int i = 0; i < keys.size(); i++) {
            String restored = unescape(PlainTextProtector.restore(translated.get(i), masks.get(i)));
            result.put(keys.get(i), restored);
        }
        TranslationDraftValidator.validateFields(source, result);
        int billed = 0;
        for (String content : contents) {
            billed += content.codePointCount(0, content.length());
        }
        return new TranslationDocumentDraft(Map.copyOf(result), new ProviderUsage(null, null, null, billed));
    }

    public TranslationProbeView testConnection() {
        SuperAdminAuthHelper.requireSuperAdmin();
        GoogleRuntime runtime = settingsService.loadGoogleRuntime();
        TranslationProbeView view = probeBase(runtime);
        if (!runtime.configured()) {
            view.setCalledProvider(false);
            view.setState(TranslationSettingsService.STATE_NOT_CONFIGURED);
            view.setErrorCode(AuditionTranslation.ERROR_NOT_CONFIGURED);
            return view;
        }
        try {
            tokenFor(runtime);
            view.setCalledProvider(true);
            view.setState("OK");
        } catch (TranslationProviderException ex) {
            view.setCalledProvider(true);
            view.setState(AuditionTranslation.STATUS_FAILED);
            view.setErrorCode(ex.getErrorCode());
        }
        return view;
    }

    public TranslationProbeView supportedLanguages() {
        SuperAdminAuthHelper.requireSuperAdmin();
        GoogleRuntime runtime = settingsService.loadGoogleRuntime();
        TranslationProbeView view = probeBase(runtime);
        if (!runtime.configured()) {
            view.setCalledProvider(false);
            view.setState(TranslationSettingsService.STATE_NOT_CONFIGURED);
            view.setErrorCode(AuditionTranslation.ERROR_NOT_CONFIGURED);
            return view;
        }
        try {
            String token = tokenFor(runtime);
            TranslationHttpResult result = transport.get(languagesUrl(runtime), token);
            if (result.statusCode() == 401) {
                tokens.invalidate(GoogleServiceAccount.parse(runtime.credentialsJson()).clientEmail());
                token = tokenFor(runtime);
                result = transport.get(languagesUrl(runtime), token);
            }
            if (result.statusCode() < 200 || result.statusCode() >= 300) {
                throw statusFailure(result.statusCode());
            }
            List<String> codes = readLanguageCodes(result.body());
            view.setCalledProvider(true);
            view.setState("OK");
            view.setLanguageCodes(codes);
            view.setKoreanSupported(supports(codes, "ko"));
            view.setEnglishSupported(supports(codes, "en"));
            view.setMongolianSupported(supports(codes, "mn"));
        } catch (TranslationProviderException ex) {
            view.setCalledProvider(true);
            view.setState(AuditionTranslation.STATUS_FAILED);
            view.setErrorCode(ex.getErrorCode());
        }
        return view;
    }

    private List<String> translateContents(String sourceLocale, String targetLocale, List<String> contents) {
        GoogleRuntime runtime = requireRuntime();
        GoogleServiceAccount account = GoogleServiceAccount.parse(runtime.credentialsJson());
        String body = requestBody(runtime, sourceLocale, targetLocale, contents);
        String token = tokens.accessToken(account);
        TranslationHttpResult result = postTranslate(translateUrl(runtime), token, body);
        if (result.statusCode() == 401) {
            log.info("translation provider {} status 401", PROVIDER_ID);
            tokens.invalidate(account.clientEmail());
            token = tokens.accessToken(account);
            result = postTranslate(translateUrl(runtime), token, body);
        }
        log.info("translation provider {} responded status {}", PROVIDER_ID, result.statusCode());
        if (result.statusCode() < 200 || result.statusCode() >= 300) {
            throw statusFailure(result.statusCode());
        }
        return readTranslations(result.body());
    }

    private TranslationHttpResult postTranslate(String url, String token, String body) {
        try {
            return transport.postJson(url, token, body);
        } catch (TranslationProviderException ex) {
            throw ex;
        }
    }

    private GoogleRuntime requireRuntime() {
        GoogleRuntime runtime = settingsService.loadGoogleRuntime();
        if (!runtime.configured()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_NOT_CONFIGURED,
                    "번역 공급자가 설정되지 않았습니다.");
        }
        return runtime;
    }

    private String tokenFor(GoogleRuntime runtime) {
        return tokens.accessToken(GoogleServiceAccount.parse(runtime.credentialsJson()));
    }

    private String requestBody(GoogleRuntime runtime, String sourceLocale, String targetLocale, List<String> contents) {
        if (targetLocale == null || targetLocale.isBlank()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_PROVIDER,
                    "번역 대상 언어가 없습니다.");
        }
        try {
            ObjectNode root = objectMapper.createObjectNode();
            ArrayNode array = root.putArray("contents");
            contents.forEach(array::add);
            root.put("mimeType", "text/plain");
            root.put("targetLanguageCode", targetLocale);
            if (sourceLocale != null && !sourceLocale.isBlank()) {
                root.put("sourceLanguageCode", sourceLocale);
            }
            root.put("model", modelResource(runtime));
            return objectMapper.writeValueAsString(root);
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 요청을 만들지 못했습니다.");
        }
    }

    private List<String> readTranslations(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode translations = root.path("translations");
            if (!translations.isArray()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 응답을 해석하지 못했습니다.");
            }
            List<String> values = new ArrayList<>();
            for (JsonNode item : translations) {
                if (!item.hasNonNull("translatedText") || !item.get("translatedText").isTextual()) {
                    throw new TranslationProviderException(
                            AuditionTranslation.ERROR_MISSING_FIELD,
                            AuditionTranslation.ERROR_MISSING_FIELD);
                }
                values.add(item.get("translatedText").asText());
            }
            return values;
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 응답을 해석하지 못했습니다.");
        }
    }

    private List<String> readLanguageCodes(String body) {
        try {
            JsonNode languages = objectMapper.readTree(body).path("languages");
            if (!languages.isArray()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "언어 목록을 해석하지 못했습니다.");
            }
            List<String> codes = new ArrayList<>();
            for (JsonNode item : languages) {
                String code = item.path("languageCode").asText("");
                if (!code.isBlank()) {
                    codes.add(code);
                }
            }
            return List.copyOf(codes);
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "언어 목록을 해석하지 못했습니다.");
        }
    }

    static String translateUrl(GoogleRuntime runtime) {
        return TRANSLATE_HOST + "/v3/projects/" + runtime.projectId() + "/locations/" + runtime.location() + ":translateText";
    }

    static String languagesUrl(GoogleRuntime runtime) {
        return TRANSLATE_HOST + "/v3/projects/" + runtime.projectId()
                + "/locations/" + runtime.location() + "/supportedLanguages";
    }

    static String modelResource(GoogleRuntime runtime) {
        String model = runtime.model() == null || runtime.model().isBlank() ? DEFAULT_MODEL : runtime.model().trim();
        return "projects/" + runtime.projectId() + "/locations/" + runtime.location() + "/models/" + model;
    }

    static TranslationProviderException statusFailure(int code) {
        String error = switch (code) {
            case 401 -> AuditionTranslation.ERROR_AUTH_FAILED;
            case 403 -> AuditionTranslation.ERROR_FORBIDDEN;
            case 429 -> AuditionTranslation.ERROR_PROVIDER_RATE_LIMITED;
            default -> code >= 500 ? AuditionTranslation.ERROR_PROVIDER : AuditionTranslation.ERROR_HTTP;
        };
        return new TranslationProviderException(error, "번역 공급자가 HTTP " + code + " 를 반환했습니다.");
    }

    private static TranslationProbeView probeBase(GoogleRuntime runtime) {
        TranslationProbeView view = new TranslationProbeView();
        view.setProvider(PROVIDER_ID);
        view.setProjectId(runtime.projectId());
        view.setLocation(runtime.location());
        return view;
    }

    private static boolean supports(List<String> codes, String language) {
        for (String code : codes) {
            if (code.equalsIgnoreCase(language) || code.toLowerCase(java.util.Locale.ROOT).startsWith(language + "-")) {
                return true;
            }
        }
        return false;
    }

    private static String unescape(String value) {
        return value.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&amp;", "&");
    }

    private static void putList(Map<String, String> fields, String name, List<String> values) {
        if (values == null) {
            return;
        }
        for (int i = 0; i < values.size(); i++) {
            fields.put(name + "[" + i + "]", text(values.get(i)));
        }
    }

    private static List<String> readList(Map<String, String> fields, String name, int size) {
        List<String> values = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            values.add(fields.getOrDefault(name + "[" + i + "]", ""));
        }
        return List.copyOf(values);
    }

    private static int size(List<String> values) {
        return values == null ? 0 : values.size();
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }
}
