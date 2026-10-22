package com.audition.platform.application.i18n.translation;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 활성 공급자로 위임한다. 기본은 Google Cloud Translation 이고 OpenAI 호환 공급자는 보조다.
 */
@Component
@Primary
public class SelectingTranslationProvider implements TranslationProvider {

    private final TranslationSettingsService settingsService;
    private final GoogleCloudTranslationProvider google;
    private final HttpTranslationProvider openAi;

    public SelectingTranslationProvider(
            TranslationSettingsService settingsService,
            GoogleCloudTranslationProvider google,
            HttpTranslationProvider openAi) {
        this.settingsService = settingsService;
        this.google = google;
        this.openAi = openAi;
    }

    @Override
    public String providerId() {
        return active().providerId();
    }

    @Override
    public boolean isConfigured() {
        return active().isConfigured();
    }

    @Override
    public TranslationDraft translate(TranslationSource source, String targetLocale) {
        return active().translate(source, targetLocale);
    }

    @Override
    public TranslationDocumentDraft translateDocument(String sourceLocale, Map<String, String> fields, String targetLocale) {
        return active().translateDocument(sourceLocale, fields, targetLocale);
    }

    private TranslationProvider active() {
        if (HttpTranslationProvider.PROVIDER_ID.equals(settingsService.activeProviderId())) {
            return openAi;
        }
        return google;
    }
}
