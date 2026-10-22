package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/** OAuth2 JWT bearer. 액세스 토큰은 로그와 예외 메시지에 넣지 않는다. */
@Component
public class GoogleAccessTokenClient {

    private final TranslationHttpTransport transport;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final ConcurrentHashMap<String, CachedToken> cache = new ConcurrentHashMap<>();

    @Autowired
    public GoogleAccessTokenClient(TranslationHttpTransport transport, ObjectMapper objectMapper) {
        this(transport, objectMapper, Clock.systemUTC());
    }

    GoogleAccessTokenClient(TranslationHttpTransport transport, ObjectMapper objectMapper, Clock clock) {
        this.transport = transport;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    String accessToken(GoogleServiceAccount account) {
        CachedToken cached = cache.get(account.clientEmail());
        Instant now = clock.instant();
        if (cached != null && cached.expiresAt().isAfter(now.plusSeconds(30))) {
            return cached.token();
        }
        return refresh(account, now);
    }

    void invalidate(String clientEmail) {
        if (clientEmail != null) {
            cache.remove(clientEmail);
        }
    }

    private String refresh(GoogleServiceAccount account, Instant now) {
        String assertion = account.assertion(now);
        String form = "grant_type="
                + URLEncoder.encode("urn:ietf:params:oauth:grant-type:jwt-bearer", StandardCharsets.UTF_8)
                + "&assertion="
                + URLEncoder.encode(assertion, StandardCharsets.UTF_8);
        TranslationHttpResult result;
        try {
            result = transport.postForm(GoogleServiceAccount.TOKEN_URL, form);
        } catch (TranslationProviderException ex) {
            throw ex;
        }
        if (result.statusCode() < 200 || result.statusCode() >= 300) {
            throw GoogleCloudTranslationProvider.statusFailure(result.statusCode());
        }
        try {
            JsonNode root = objectMapper.readTree(result.body());
            String token = root.path("access_token").asText("");
            if (token.isBlank()) {
                throw new TranslationProviderException(
                        AuditionTranslation.ERROR_PROVIDER,
                        "OAuth 토큰 응답을 해석하지 못했습니다.");
            }
            long expiresIn = root.path("expires_in").asLong(300L);
            Instant expiry = now.plusSeconds(Math.max(0L, expiresIn - 60L));
            cache.put(account.clientEmail(), new CachedToken(token, expiry));
            return token;
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_PROVIDER,
                    "OAuth 토큰 응답을 해석하지 못했습니다.");
        }
    }

    private record CachedToken(String token, Instant expiresAt) {
    }
}
