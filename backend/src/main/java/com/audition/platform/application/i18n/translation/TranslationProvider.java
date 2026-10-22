package com.audition.platform.application.i18n.translation;

import java.util.Map;

/**
 * 자동 번역 공급자. 구현은 설정이 있을 때만 외부 API를 호출한다.
 * 설정이 없으면 번역문을 만들지 않고 {@link TranslationProviderException} 을 던진다.
 */
public interface TranslationProvider {

    String providerId();

    boolean isConfigured();

    TranslationDraft translate(TranslationSource source, String targetLocale);

    /**
     * 같은 HTTP 어댑터로 임의 문자열 필드를 번역한다. 오디션 전용 초안과 GPT 호출을 복제하지 않는다.
     */
    TranslationDocumentDraft translateDocument(String sourceLocale, Map<String, String> fields, String targetLocale);
}
