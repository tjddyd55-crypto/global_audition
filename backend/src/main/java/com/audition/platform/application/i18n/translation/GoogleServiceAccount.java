package com.audition.platform.application.i18n.translation;

import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Pattern;

/**
 * 서비스 계정 JSON 으로 OAuth JWT bearer 를 만든다. API 키 형식은 거절한다.
 * 개인 키와 assertion 은 예외 메시지에 넣지 않는다.
 */
final class GoogleServiceAccount {

    static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    static final String SCOPE = "https://www.googleapis.com/auth/cloud-translation";
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String clientEmail;
    private final PrivateKey privateKey;

    private GoogleServiceAccount(String clientEmail, PrivateKey privateKey) {
        this.clientEmail = clientEmail;
        this.privateKey = privateKey;
    }

    String clientEmail() {
        return clientEmail;
    }

    static GoogleServiceAccount parse(String json) {
        if (json == null || json.isBlank()) {
            throw invalid();
        }
        String trimmed = json.trim();
        if (!trimmed.startsWith("{") || looksLikeApiKey(trimmed)) {
            throw invalid();
        }
        try {
            JsonNode root = MAPPER.readTree(trimmed);
            if (root == null || !root.isObject() || !"service_account".equals(root.path("type").asText())) {
                throw invalid();
            }
            String email = root.path("client_email").asText("");
            if (!EMAIL.matcher(email).matches()) {
                throw invalid();
            }
            String tokenUri = root.path("token_uri").asText("");
            if (!tokenUri.isBlank() && !TOKEN_URL.equals(tokenUri)) {
                throw invalid();
            }
            PrivateKey key = readPrivateKey(root.path("private_key").asText(""));
            return new GoogleServiceAccount(email, key);
        } catch (TranslationProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            throw invalid();
        }
    }

    String assertion(Instant now) {
        try {
            String header = b64("{\"alg\":\"RS256\",\"typ\":\"JWT\"}");
            long issued = now.getEpochSecond();
            String payload = b64(MAPPER.createObjectNode()
                    .put("iss", clientEmail)
                    .put("scope", SCOPE)
                    .put("aud", TOKEN_URL)
                    .put("iat", issued - 60)
                    .put("exp", issued + 3600)
                    .toString());
            String signingInput = header + "." + payload;
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(signingInput.getBytes(StandardCharsets.UTF_8));
            return signingInput + "." + b64(signature.sign());
        } catch (Exception ex) {
            throw new TranslationProviderException(
                    AuditionTranslation.ERROR_INVALID_CREDENTIALS,
                    "서비스 계정 서명을 만들지 못했습니다.");
        }
    }

    private static PrivateKey readPrivateKey(String pem) throws Exception {
        String normalized = pem.replace("\\n", "\n").trim();
        if (!normalized.contains("BEGIN PRIVATE KEY") || normalized.contains("BEGIN RSA PRIVATE KEY")) {
            throw invalid();
        }
        String body = normalized
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        if (body.isBlank()) {
            throw invalid();
        }
        byte[] der = Base64.getDecoder().decode(body);
        return KeyFactory.getInstance("RSA").generatePrivate(new java.security.spec.PKCS8EncodedKeySpec(der));
    }

    private static boolean looksLikeApiKey(String value) {
        return value.startsWith("sk-") || value.startsWith("AIza");
    }

    private static String b64(String value) {
        return b64(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String b64(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static TranslationProviderException invalid() {
        return new TranslationProviderException(
                AuditionTranslation.ERROR_INVALID_CREDENTIALS,
                "서비스 계정 JSON 형식이 아닙니다.");
    }
}
