package com.audition.platform.application.i18n.translation;

import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class JdkTranslationHttpTransport implements TranslationHttpTransport {

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public TranslationHttpResult postJson(String url, String bearerToken, String jsonBody) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + bearerToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return new TranslationHttpResult(response.statusCode(), response.body());
        } catch (Exception e) {
            throw new TranslationProviderException(
                    "PROVIDER_ERROR",
                    "번역 공급자에 연결하지 못했습니다.");
        }
    }
}
