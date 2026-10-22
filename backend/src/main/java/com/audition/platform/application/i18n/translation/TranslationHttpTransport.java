package com.audition.platform.application.i18n.translation;

public interface TranslationHttpTransport {

    TranslationHttpResult postJson(String url, String bearerToken, String jsonBody);
}
