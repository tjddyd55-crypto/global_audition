package com.audition.platform.application.i18n.translation;

public interface TranslationHttpTransport {

    TranslationHttpResult postJson(String url, String bearerToken, String jsonBody);

    /** OAuth 토큰 엔드포인트. Authorization 헤더를 붙이지 않는다. */
    TranslationHttpResult postForm(String url, String formBody);

    TranslationHttpResult get(String url, String bearerToken);
}
