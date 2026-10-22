package com.audition.platform.application.i18n.translation;

/** 서버 메모리에서만 쓰는 공급자 설정. API 응답으로 내보내지 않는다. */
public record TranslationRuntime(
        String providerId,
        String endpointUrl,
        String model,
        String apiKey,
        boolean configured) {
}
