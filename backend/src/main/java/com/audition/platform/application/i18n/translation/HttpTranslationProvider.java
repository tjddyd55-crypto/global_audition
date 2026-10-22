package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI 호환 chat completions 어댑터.
 * 키·엔드포인트·모델이 없으면 호출하지 않고 NOT_CONFIGURED 를 반환한다.
 */
@Component
public class HttpTranslationProvider implements TranslationProvider {

    public static final String PROVIDER_ID = "OPENAI_COMPATIBLE";
    private static final int MAX_TEXT = 20_000;
    private static final int MAX_ITEMS = 40;
    private static final Logger log = LoggerFactory.getLogger(HttpTranslationProvider.class);

    private final TranslationSettingsService settingsService;
    private final TranslationHttpTransport transport;
    private final ObjectMapper objectMapper;

    public HttpTranslationProvider(
            TranslationSettingsService settingsService,
            TranslationHttpTransport transport,
            ObjectMapper objectMapper) {
        this.settingsService = settingsService;
        this.transport = transport;
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerId() {
        return PROVIDER_ID;
    }

    @Override
    public boolean isConfigured() {
        return settingsService.loadRuntime().configured();
    }

    @Override
    public TranslationDraft translate(TranslationSource source, String targetLocale) {
        TranslationRuntime runtime = requireRuntime();
        ChatCompletion completion = complete(runtime, requestBody(runtime.model(), source, targetLocale));
        return parseDraft(completion.content());
    }

    @Override
    public TranslationDocumentDraft translateDocument(String sourceLocale, Map<String, String> fields, String targetLocale) {
        TranslationRuntime runtime = requireRuntime();
        Map<String, String> sourceFields = fields == null ? Map.of() : fields;
        ChatCompletion completion = complete(runtime, documentRequestBody(runtime.model(), sourceLocale, sourceFields, targetLocale));
        return new TranslationDocumentDraft(parseFields(completion.content(), sourceFields.keySet()), completion.usage());
    }

    private TranslationRuntime requireRuntime() {
        TranslationRuntime runtime = settingsService.loadRuntime();
        if (!runtime.configured()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_NOT_CONFIGURED,
                    "번역 공급자가 설정되지 않았습니다.");
        }
        return runtime;
    }

    private ChatCompletion complete(TranslationRuntime runtime, String body) {
        TranslationHttpResult result = transport.postJson(runtime.endpointUrl(), runtime.apiKey(), body);
        log.info("translation provider {} responded status {}", PROVIDER_ID, result.statusCode());
        if (result.statusCode() >= 300 && result.statusCode() < 400) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자 리다이렉트를 따르지 않습니다.");
        }
        if (result.statusCode() < 200 || result.statusCode() >= 300) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_HTTP,
                    "번역 공급자가 HTTP " + result.statusCode() + " 를 반환했습니다.");
        }
        return parseCompletion(result.body());
    }

    private String requestBody(String model, TranslationSource source, String targetLocale) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("model", model);
            root.putObject("response_format").put("type", "json_object");
            var messages = root.putArray("messages");
            messages.addObject()
                    .put("role", "system")
                    .put("content", systemPrompt(targetLocale));
            messages.addObject()
                    .put("role", "user")
                    .put("content", objectMapper.writeValueAsString(source));
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 요청을 만들지 못했습니다.");
        }
    }

    private static String systemPrompt(String targetLocale) {
        return "Translate the JSON string values into locale "
                + targetLocale
                + ". Return only a JSON object with keys title, description, location, agencyName, "
                + "recruitFields, qualifications, schedules, benefits. Do not invent facts. "
                + "Keep array lengths. Do not include the source text unchanged as a fake translation.";
    }

    private String documentRequestBody(
            String model, String sourceLocale, Map<String, String> fields, String targetLocale) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("model", model);
            root.putObject("response_format").put("type", "json_object");
            var messages = root.putArray("messages");
            messages.addObject().put("role", "system").put("content", documentPrompt(targetLocale, fields.keySet()));
            ObjectNode user = objectMapper.createObjectNode();
            if (sourceLocale != null && !sourceLocale.isBlank()) {
                user.put("sourceLocale", sourceLocale);
            }
            ObjectNode body = user.putObject("fields");
            fields.forEach(body::put);
            messages.addObject().put("role", "user").put("content", objectMapper.writeValueAsString(user));
            return objectMapper.writeValueAsString(root);
        } catch (Exception e) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 요청을 만들지 못했습니다.");
        }
    }

    private static String documentPrompt(String targetLocale, java.util.Set<String> keys) {
        return "Translate the JSON string values in fields into locale "
                + targetLocale
                + ". Return only a JSON object with these keys: "
                + String.join(", ", keys)
                + ". Keep empty strings empty. Do not invent facts or keys.";
    }

    private ChatCompletion parseCompletion(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 본문이 비어 있습니다.");
            }
            return new ChatCompletion(content, usage(root.path("usage")));
        } catch (TranslationProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 응답을 해석하지 못했습니다.");
        }
    }

    private static ProviderUsage usage(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull() || !node.isObject()) {
            return null;
        }
        Integer prompt = integerOrNull(node, "prompt_tokens");
        Integer completion = integerOrNull(node, "completion_tokens");
        Integer total = integerOrNull(node, "total_tokens");
        if (prompt == null && completion == null && total == null) {
            return null;
        }
        return new ProviderUsage(prompt, completion, total);
    }

    private static Integer integerOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || !value.isNumber()) {
            return null;
        }
        return value.asInt();
    }

    private TranslationDraft parseDraft(String content) {
        try {
            JsonNode draft = objectMapper.readTree(content);
            if (draft == null || !draft.isObject()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 응답을 해석하지 못했습니다.");
            }
            return new TranslationDraft(
                    optionalText(draft, "title"),
                    optionalText(draft, "description"),
                    optionalText(draft, "location"),
                    optionalText(draft, "agencyName"),
                    textList(draft, "recruitFields"),
                    textList(draft, "qualifications"),
                    textList(draft, "schedules"),
                    textList(draft, "benefits"));
        } catch (TranslationProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 응답을 해석하지 못했습니다.");
        }
    }

    private static String optionalText(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.length() > MAX_TEXT) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_MALFORMED_JSON, "번역 필드가 너무 깁니다.");
        }
        return value;
    }

    private static List<String> textList(JsonNode node, String field) {
        JsonNode array = node.path(field);
        if (array.isMissingNode() || array.isNull()) {
            return List.of();
        }
        if (!array.isArray() || array.size() > MAX_ITEMS) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_MALFORMED_JSON, "번역 목록 형식이 올바르지 않습니다.");
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : array) {
            String text = item.asText("");
            if (!item.isTextual() && !item.isNumber()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 목록 형식이 올바르지 않습니다.");
            }
            if (text.length() > MAX_TEXT) {
                throw new TranslationProviderException(AuditionTranslation.ERROR_MALFORMED_JSON, "번역 항목이 너무 깁니다.");
            }
            values.add(text.trim());
        }
        return List.copyOf(values);
    }

    private Map<String, String> parseFields(String content, java.util.Set<String> keys) {
        try {
            JsonNode draft = objectMapper.readTree(content);
            if (draft == null || !draft.isObject()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_MALFORMED_JSON,
                        "번역 응답을 해석하지 못했습니다.");
            }
            Map<String, String> fields = new LinkedHashMap<>();
            for (String key : keys) {
                fields.put(key, optionalText(draft, key));
            }
            return Map.copyOf(fields);
        } catch (TranslationProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_MALFORMED_JSON,
                    "번역 응답을 해석하지 못했습니다.");
        }
    }

    private record ChatCompletion(String content, ProviderUsage usage) {
    }
}
