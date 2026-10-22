package com.audition.platform.application.i18n.translation;

import com.audition.platform.application.i18n.TranslationAttemptRecorder;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationRows.StoredTranslation;
import com.audition.platform.application.i18n.content.ContentTranslationSource;
import com.audition.platform.application.i18n.content.ContentTranslationWorker;
import com.audition.platform.application.i18n.content.ContentTypes;
import com.audition.platform.application.i18n.content.MemoryContentTranslationStore;
import com.audition.platform.application.i18n.content.TranslationCostEstimator;
import com.audition.platform.application.i18n.content.TranslationQueueProperties;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.time.Clock;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GoogleCloudTranslationProviderTest {

    private static String serviceAccountJson;
    private static KeyPair keyPair;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private TranslationSettingsService settings;
    private ScriptedTranslationTransport transport;
    private GoogleCloudTranslationProvider provider;

    @BeforeAll
    static void keys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();
        String pem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(keyPair.getPrivate().getEncoded())
                + "\n-----END PRIVATE KEY-----\n";
        serviceAccountJson = MAPPER.createObjectNode()
                .put("type", "service_account")
                .put("client_email", "translator@demo-project.iam.gserviceaccount.com")
                .put("token_uri", "https://oauth2.googleapis.com/token")
                .put("private_key", pem)
                .toString();
    }

    @BeforeEach
    void setUp() {
        settings = mock(TranslationSettingsService.class);
        transport = new ScriptedTranslationTransport();
        provider = new GoogleCloudTranslationProvider(
                settings,
                transport,
                new GoogleAccessTokenClient(transport, MAPPER, Clock.systemUTC()),
                MAPPER);
        when(settings.loadGoogleRuntime()).thenReturn(new GoogleRuntime(
                "demo-project", "global", "general/nmt", serviceAccountJson, true));
        when(settings.effectiveGoogleCharacterRate()).thenReturn(20_000_000L);
    }

    @Test
    void translateRequestUsesOauthBearerAndPreservesFieldOrder() throws Exception {
        transport.respond(200, token("ya29.token-a"));
        transport.respond(200, """
                {"translations":[{"translatedText":"hello"},{"translatedText":"next"}]}
                """);
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("introText", "안녕");
        fields.put("note", "다음");

        TranslationDocumentDraft draft = provider.translateDocument("ko", fields, "en");

        assertEquals("FORM", transport.calls.get(0).kind());
        assertEquals(GoogleServiceAccount.TOKEN_URL, transport.calls.get(0).url());
        assertTrue(transport.calls.get(0).body().contains("grant_type="));
        verifyAssertion(transport.calls.get(0).body());
        assertEquals("POST", transport.calls.get(1).kind());
        assertEquals(
                "https://translate.googleapis.com/v3/projects/demo-project/locations/global:translateText",
                transport.calls.get(1).url());
        assertEquals("ya29.token-a", transport.calls.get(1).bearer());
        JsonNode body = MAPPER.readTree(transport.calls.get(1).body());
        assertEquals("text/plain", body.path("mimeType").asText());
        assertEquals("ko", body.path("sourceLanguageCode").asText());
        assertEquals("en", body.path("targetLanguageCode").asText());
        assertEquals("projects/demo-project/locations/global/models/general/nmt", body.path("model").asText());
        assertEquals(List.of("안녕", "다음"), List.of(body.path("contents").get(0).asText(), body.path("contents").get(1).asText()));
        assertEquals("hello", draft.fields().get("introText"));
        assertEquals("next", draft.fields().get("note"));
        assertEquals(body.path("contents").get(0).asText().length() + body.path("contents").get(1).asText().length(),
                draft.usage().billedCharacters());
        assertEquals(draft.usage().billedCharacters() * 20L, new TranslationCostEstimator(new TranslationQueueProperties(), settings)
                .estimateMicroUsd(draft.usage()));
    }

    @Test
    void refreshesTheAccessTokenAfterUnauthorizedAndAfterExpiry() {
        transport.respond(200, token("ya29.token-a", 1));
        transport.respond(200, "{\"translations\":[{\"translatedText\":\"one\"}]}");
        transport.respond(200, token("ya29.token-b", 3600));
        transport.respond(401, "{\"error\":\"secret-body-marker\"}");
        transport.respond(200, token("ya29.token-c", 3600));
        transport.respond(200, "{\"translations\":[{\"translatedText\":\"two\"}]}");

        provider.translateDocument("ko", Map.of("introText", "하나"), "en");
        provider.translateDocument("ko", Map.of("introText", "둘"), "en");

        assertEquals("ya29.token-a", transport.calls.get(1).bearer());
        assertEquals("ya29.token-b", transport.calls.get(3).bearer());
        assertEquals("ya29.token-c", transport.calls.get(5).bearer());
        assertFalse(transport.calls.get(3).body().contains("secret-body-marker"));
    }

    @Test
    void mapsProviderErrorsAndDropsResponseBodies() {
        assertStatus(401, AuditionTranslation.ERROR_AUTH_FAILED, true);
        assertStatus(403, AuditionTranslation.ERROR_FORBIDDEN, false);
        assertStatus(429, AuditionTranslation.ERROR_PROVIDER_RATE_LIMITED, false);
        assertStatus(503, AuditionTranslation.ERROR_PROVIDER, false);
        transport.clear();
        transport.respond(200, token("ya29.token-a"));
        transport.fail(new TranslationProviderException(
                AuditionTranslation.ERROR_TIMEOUT, "번역 공급자 응답 시간이 초과되었습니다."));
        TranslationProviderException timeout = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", Map.of("introText", "안녕"), "en"));
        assertEquals(AuditionTranslation.ERROR_TIMEOUT, timeout.getErrorCode());
    }

    @Test
    void partialOrMissingTranslationsFailAndLeaveTheSourceUntouched() {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("introText", "안녕");
        fields.put("note", "다음");
        Map<String, String> original = new LinkedHashMap<>(fields);
        transport.respond(200, token("ya29.token-a"));
        transport.respond(200, "{\"translations\":[{\"translatedText\":\"only-one\"}]}");

        TranslationProviderException mismatch = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", fields, "en"));

        assertEquals(AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH, mismatch.getErrorCode());
        assertEquals(original, fields);
        transport.clear();
        transport.respond(200, "{\"translations\":[{}]}");
        TranslationProviderException missing = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", fields, "mn"));
        assertEquals(AuditionTranslation.ERROR_MISSING_FIELD, missing.getErrorCode());
        assertEquals(original, fields);
        assertFalse(missing.getMessage().contains("only-one"));
    }

    @Test
    void placeholdersAndNewlinesRoundTrip() {
        transport.respond(200, token("ya29.token-a"));
        transport.echoTranslations("EN ");
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("introText", "안녕 {name}\n다음 %s");

        TranslationDocumentDraft draft = provider.translateDocument("ko", fields, "en");

        assertEquals("EN 안녕 {name}\n다음 %s", draft.fields().get("introText"));
        assertTrue(draft.usage().billedCharacters() > 0);
    }

    @Test
    void missingSentinelFailsClosed() {
        transport.respond(200, token("ya29.token-a"));
        transport.respond(200, "{\"translations\":[{\"translatedText\":\"dropped\"}]}");
        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", Map.of("introText", "안녕 {name}"), "en"));
        assertEquals(AuditionTranslation.ERROR_MISSING_FIELD, ex.getErrorCode());
    }

    @Test
    void notConfiguredDoesNotCallTheNetwork() {
        when(settings.loadGoogleRuntime()).thenReturn(new GoogleRuntime("", "", "", null, false));
        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", Map.of("introText", "안녕"), "en"));
        assertEquals(AuditionTranslation.ERROR_NOT_CONFIGURED, ex.getErrorCode());
        assertTrue(transport.calls.isEmpty());
    }

    @Test
    void manualAndOriginalRowsStayWhenTheProviderFails() {
        MemoryContentTranslationStore store = new MemoryContentTranslationStore();
        TranslationQueueProperties properties = new TranslationQueueProperties();
        properties.setMaxAttempts(1);
        TranslationAttemptRecorder recorder = mock(TranslationAttemptRecorder.class);
        when(recorder.startContent(any())).thenAnswer(invocation -> store.insertAttempt(invocation.getArgument(0)));
        doAnswer(invocation -> {
            store.finishAttempt(invocation.getArgument(0));
            return null;
        }).when(recorder).finishContent(any());
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("introText", "원문");
        UUID id = UUID.randomUUID();
        ContentTranslationSource source = anyIntro(fields);
        ContentTranslationWorker worker = new ContentTranslationWorker(
                store, List.of(source), provider, recorder,
                new TranslationCostEstimator(properties, settings), properties, MAPPER);
        store.insertTranslation(new StoredTranslation(
                ContentTypes.APPLICATION_INTRO, id, "en", "ko", "hash", 1L,
                "{\"introText\":\"사람이 고친 문장\"}",
                AuditionTranslation.STATUS_COMPLETED, false, "GOOGLE_CLOUD_TRANSLATION",
                AuditionTranslation.ORIGIN_MANUAL, true, 0L, null, null));
        store.insertPendingJob(new NewJob(
                UUID.randomUUID(), ContentTypes.APPLICATION_INTRO, id, "en", "hash", null, null, 1, false));

        worker.drain();

        assertEquals("{\"introText\":\"사람이 고친 문장\"}",
                store.findTranslation(ContentTypes.APPLICATION_INTRO, id, "en").orElseThrow().bodyJson());
        assertEquals("원문", fields.get("introText"));
        assertTrue(transport.calls.isEmpty());
        assertEquals(ContentTypes.JOB_BLOCKED, store.findLatestJob(ContentTypes.APPLICATION_INTRO, id, "en").orElseThrow().status());

        UUID generated = UUID.randomUUID();
        store.insertTranslation(new StoredTranslation(
                ContentTypes.APPLICATION_INTRO, generated, "en", "ko", "hash", 1L,
                "{\"introText\":\"en:원문\"}",
                AuditionTranslation.STATUS_COMPLETED, false, "GOOGLE_CLOUD_TRANSLATION",
                AuditionTranslation.ORIGIN_AUTO, false, 0L, null, null));
        transport.respond(200, token("ya29.token-a"));
        transport.respond(200, "{\"translations\":[]}");
        store.insertPendingJob(new NewJob(
                UUID.randomUUID(), ContentTypes.APPLICATION_INTRO, generated, "en", "hash", null, null, 1, false));
        worker.drain();
        assertEquals("{\"introText\":\"en:원문\"}",
                store.findTranslation(ContentTypes.APPLICATION_INTRO, generated, "en").orElseThrow().bodyJson());
        assertEquals(AuditionTranslation.ERROR_ARRAY_LENGTH_MISMATCH,
                store.findLatestJob(ContentTypes.APPLICATION_INTRO, generated, "en").orElseThrow().errorCode());
    }

    private void assertStatus(int status, String code, boolean refresh) {
        transport.clear();
        transport.respond(200, token("ya29.token-a"));
        transport.respond(status, "{\"error\":\"secret-body-marker\"}");
        if (refresh) {
            transport.respond(200, token("ya29.token-b"));
            transport.respond(status, "{\"error\":\"secret-body-marker\"}");
        }
        TranslationProviderException ex = assertThrows(
                TranslationProviderException.class,
                () -> provider.translateDocument("ko", Map.of("introText", "안녕"), "en"));
        assertEquals(code, ex.getErrorCode());
        assertFalse(ex.getMessage().contains("secret-body"));
        assertEquals(AuditionTranslation.STATUS_FAILED, "FAILED");
    }

    private static void verifyAssertion(String form) throws Exception {
        String encoded = form.substring(form.indexOf("assertion=") + "assertion=".length());
        String jwt = URLDecoder.decode(encoded, StandardCharsets.UTF_8);
        String[] parts = jwt.split("\\.");
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initVerify(keyPair.getPublic());
        signature.update((parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8));
        assertTrue(signature.verify(Base64.getUrlDecoder().decode(parts[2])));
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        assertTrue(payload.contains(GoogleServiceAccount.SCOPE));
        assertTrue(payload.contains("translator@demo-project.iam.gserviceaccount.com"));
        assertTrue(payload.contains(GoogleServiceAccount.TOKEN_URL));
    }

    private static String token(String access) {
        return token(access, 3600);
    }

    private static String token(String access, int expiresIn) {
        return "{\"access_token\":\"" + access + "\",\"expires_in\":" + expiresIn + ",\"token_type\":\"Bearer\"}";
    }

    private static ContentTranslationSource anyIntro(Map<String, String> fields) {
        return new ContentTranslationSource() {
            @Override
            public String type() {
                return ContentTypes.APPLICATION_INTRO;
            }

            @Override
            public Optional<ContentSnapshot> load(UUID contentId) {
                return Optional.of(new ContentSnapshot(type(), contentId, "ko", fields, null, null));
            }

            @Override
            public boolean canRead(ContentSnapshot snapshot, UUID viewer) {
                return true;
            }

            @Override
            public boolean canWrite(ContentSnapshot snapshot, UUID viewer) {
                return true;
            }
        };
    }
}
