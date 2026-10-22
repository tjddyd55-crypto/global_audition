package com.audition.platform.application.i18n.translation;

/**
 * 자동 번역 공급자. 구현은 설정이 있을 때만 외부 API를 호출한다.
 * 설정이 없으면 번역문을 만들지 않고 {@link TranslationProviderException} 을 던진다.
 */
public interface TranslationProvider {

    String providerId();

    boolean isConfigured();

    TranslationDraft translate(TranslationSource source, String targetLocale);
}
