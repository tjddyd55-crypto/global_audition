package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

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
        TranslationRuntime runtime = settingsService.loadRuntime();
        if (!runtime.configured()) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_NOT_CONFIGURED,
                    "번역 공급자가 설정되지 않았습니다.");
        }
        assertHttpsEndpoint(runtime.endpointUrl());
        String body = requestBody(runtime.model(), source, targetLocale);
        TranslationHttpResult result = transport.postJson(runtime.endpointUrl(), runtime.apiKey(), body);
        log.info("translation provider {} responded status {}", PROVIDER_ID, result.statusCode());
        if (result.statusCode() < 200 || result.statusCode() >= 300) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_PROVIDER,
                    "번역 공급자가 HTTP " + result.statusCode() + " 를 반환했습니다.");
        }
        return parseDraft(result.body());
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

    private TranslationDraft parseDraft(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 본문이 비어 있습니다.");
            }
            JsonNode draft = objectMapper.readTree(content);
            String title = requiredText(draft, "title");
            return new TranslationDraft(
                    title,
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
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 응답을 해석하지 못했습니다.");
        }
    }

    private static void assertHttpsEndpoint(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || isBlockedHost(host)) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_NOT_CONFIGURED,
                        "번역 엔드포인트는 공개 https 주소여야 합니다.");
            }
        } catch (TranslationProviderException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_NOT_CONFIGURED,
                    "번역 엔드포인트가 올바르지 않습니다.");
        }
    }

    private static boolean isBlockedHost(String host) {
        return host.isBlank()
                || "localhost".equals(host)
                || host.endsWith(".local")
                || host.equals("127.0.0.1")
                || host.equals("0.0.0.0")
                || host.equals("169.254.169.254")
                || host.startsWith("10.")
                || host.startsWith("192.168.")
                || host.startsWith("172.16.");
    }

    private static String requiredText(JsonNode node, String field) {
        String value = optionalText(node, field);
        if (value.isBlank()) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 제목이 없습니다.");
        }
        return value;
    }

    private static String optionalText(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.length() > MAX_TEXT) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 필드가 너무 깁니다.");
        }
        return value;
    }

    private static List<String> textList(JsonNode node, String field) {
        JsonNode array = node.path(field);
        if (array.isMissingNode() || array.isNull()) {
            return List.of();
        }
        if (!array.isArray() || array.size() > MAX_ITEMS) {
            throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 목록 형식이 올바르지 않습니다.");
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : array) {
            String text = item.asText("");
            if (text.length() > MAX_TEXT) {
                throw new TranslationProviderException(AuditionTranslation.ERROR_PROVIDER, "번역 항목이 너무 깁니다.");
            }
            if (!text.isBlank()) {
                values.add(text.trim());
            }
        }
        return List.copyOf(values);
    }
}
