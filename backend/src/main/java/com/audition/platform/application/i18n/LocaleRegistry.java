package com.audition.platform.application.i18n;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Web·Native·서버가 같은 {@code messages/locales.json} 을 쓴다.
 * UI 로케일은 카탈로그가 완성된 primary 만이다. 콘텐츠 번역 로케일은 providerLocales 다.
 */
@Component
public class LocaleRegistry {

    public static final String UI_CATALOG_INCOMPLETE = "UI_CATALOG_INCOMPLETE";
    public static final String PROVIDER_UNSUPPORTED = "PROVIDER_UNSUPPORTED";

    private final String defaultLocale;
    private final String agencyUiLocale;
    private final String superAdminUiLocale;
    private final List<String> uiLocales;
    private final List<String> publicSelector;
    private final List<String> activeTargets;
    private final Set<String> providerLocales;

    public LocaleRegistry() {
        this(readRegistry());
    }

    LocaleRegistry(JsonNode root) {
        this.defaultLocale = text(root, "defaultLocale", "en");
        this.uiLocales = List.copyOf(stringList(root.get("primary")));
        this.providerLocales = Set.copyOf(stringList(root.get("providerLocales")));
        if (!uiLocales.contains(defaultLocale)) {
            throw new IllegalStateException("default locale must be an active UI locale");
        }
        for (String ui : uiLocales) {
            if (!providerSupports(ui)) {
                throw new IllegalStateException("UI locale is not a provider locale: " + ui);
            }
        }
        JsonNode targets = root.get("activeTranslationTargets");
        this.activeTargets = List.copyOf(targets == null || !targets.isArray()
                ? new ArrayList<>(providerLocales)
                : stringList(targets));
        for (String target : activeTargets) {
            if (!providerSupports(target)) {
                throw new IllegalStateException("active translation target is not a provider locale: " + target);
            }
        }
        JsonNode selector = root.get("publicSelector");
        this.publicSelector = List.copyOf(selector == null || !selector.isArray()
                ? List.of(defaultLocale)
                : stringList(selector));
        for (String item : publicSelector) {
            if (!uiLocales.contains(item)) {
                throw new IllegalStateException("public selector locale is not a UI locale: " + item);
            }
        }
        this.agencyUiLocale = text(root, "agencyUiLocale", "ko");
        this.superAdminUiLocale = text(root, "superAdminUiLocale", "ko");
        if (!uiLocales.contains(agencyUiLocale) || !uiLocales.contains(superAdminUiLocale)) {
            throw new IllegalStateException("agency and super admin locales must be UI locales");
        }
    }

    public String viewingDefault() {
        return defaultLocale;
    }

    public String agencyUiLocale() {
        return agencyUiLocale;
    }

    public String superAdminUiLocale() {
        return superAdminUiLocale;
    }

    public List<String> uiLocales() {
        return uiLocales;
    }

    public List<String> publicSelector() {
        return publicSelector;
    }

    /** 1차 운영에서 실제로 큐에 넣는 대상. 영어가 목록의 앞에 온다. */
    public List<String> activeTargets() {
        return activeTargets;
    }

    public boolean activeTarget(String raw) {
        String tag = Bcp47Tags.canonicalize(raw);
        if (tag.isEmpty()) {
            return false;
        }
        if (activeTargets.contains(tag)) {
            return true;
        }
        return activeTargets.contains(Bcp47Tags.language(tag));
    }

    public Set<String> providerLocales() {
        return providerLocales;
    }

    public boolean uiLocale(String raw) {
        String tag = Bcp47Tags.canonicalize(raw);
        return uiLocales.contains(tag);
    }

    /**
     * 언어 서브태그가 공급자 목록에 있으면 zh-Hant 처럼 스크립트를 유지한 채 허용한다.
     * 목록에 없는 pt-BR 은 거절한다. ko/en/mn 세 개에 구현을 묶지 않는다.
     */
    public boolean providerSupports(String raw) {
        String tag = Bcp47Tags.canonicalize(raw);
        if (tag.isEmpty()) {
            return false;
        }
        if (providerLocales.contains(tag)) {
            return true;
        }
        return providerLocales.contains(Bcp47Tags.language(tag));
    }

    /**
     * 런타임에 UI 로케일을 켜는 경로가 생기면 이 검사를 통과해야 한다.
     * primary 밖은 카탈로그가 완성되지 않은 것으로 본다. 저장하지 않는다.
     */
    public void rejectIncompleteUiActivation(String raw) {
        String tag = Bcp47Tags.canonicalize(raw);
        if (!providerSupports(tag)) {
            throw new IllegalArgumentException(PROVIDER_UNSUPPORTED);
        }
        if (!uiLocales.contains(tag)) {
            throw new IllegalArgumentException(UI_CATALOG_INCOMPLETE);
        }
    }

    private static JsonNode readRegistry() {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream in = LocaleRegistry.class.getResourceAsStream("/i18n/locales.json")) {
            if (in == null) {
                throw new IllegalStateException("i18n/locales.json is missing");
            }
            return mapper.readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("i18n/locales.json could not be read", e);
        }
    }

    private static String text(JsonNode root, String field, String fallback) {
        JsonNode node = root.get(field);
        if (node == null || node.asText("").isBlank()) {
            return fallback;
        }
        return node.asText();
    }

    private static List<String> stringList(JsonNode node) {
        if (node == null || !node.isArray()) {
            return List.of();
        }
        Set<String> values = new LinkedHashSet<>();
        for (JsonNode item : node) {
            String tag = Bcp47Tags.canonicalize(item.asText(""));
            if (!tag.isEmpty()) {
                values.add(tag);
            }
        }
        return new ArrayList<>(values);
    }
}
