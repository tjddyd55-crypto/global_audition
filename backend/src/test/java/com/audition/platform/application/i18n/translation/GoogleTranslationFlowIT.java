package com.audition.platform.application.i18n.translation;

import com.audition.platform.api.dto.TranslationProbeView;
import com.audition.platform.api.dto.TranslationSettingsPatchRequest;
import com.audition.platform.api.dto.TranslationSettingsView;
import com.audition.platform.api.dto.TranslationUsageView;
import com.audition.platform.application.i18n.content.ContentTranslationRows.ContentSnapshot;
import com.audition.platform.application.i18n.content.ContentTranslationRows.NewJob;
import com.audition.platform.application.i18n.content.ContentTranslationSource;
import com.audition.platform.application.i18n.content.ContentTranslationStore;
import com.audition.platform.application.i18n.content.ContentTranslationWorker;
import com.audition.platform.domain.audition.AuditionTranslation;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;

import java.security.KeyPairGenerator;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/audition_engine_test",
        "spring.datasource.username=postgres",
        "spring.datasource.password=postgres",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
        "app.jwt.secret=change-me-in-production-min-32-chars"
})
class GoogleTranslationFlowIT {

    private static final String FIXTURE = "GOOGLE_FIXTURE";

    @Autowired
    private TranslationSettingsService settings;
    @Autowired
    private GoogleCloudTranslationProvider google;
    @Autowired
    private TranslationProvider provider;
    @Autowired
    private TranslationHttpTransport transport;
    @Autowired
    private ScriptedTranslationTransport scripted;
    @Autowired
    private ContentTranslationStore store;
    @Autowired
    private ContentTranslationWorker worker;
    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void superAdmin() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                UUID.randomUUID(), null, List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
        scripted.clear();
        jdbc.update("DELETE FROM content_translation_attempts");
        jdbc.update("DELETE FROM content_translation_jobs");
        jdbc.update("DELETE FROM content_translations");
        clearGoogle();
    }

    @AfterEach
    void cleanup() {
        clearGoogle();
        SecurityContextHolder.clearContext();
    }

    @Test
    void localBackendUsesTheMockGoogleEndpointAndRecordsCharacters() throws Exception {
        assertInstanceOf(ScriptedTranslationTransport.class, transport);
        Integer version = jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '48'", Integer.class);
        assertEquals(1, version);
        Integer billedColumn = jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_name = 'content_translation_attempts' AND column_name = 'billed_characters'
                """, Integer.class);
        assertEquals(1, billedColumn);

        TranslationSettingsPatchRequest request = new TranslationSettingsPatchRequest();
        request.setActiveProvider(GoogleCloudTranslationProvider.PROVIDER_ID);
        request.setGoogleProjectId("demo-project");
        request.setGoogleLocation("global");
        request.setGoogleModel("general/nmt");
        request.setGoogleCredentialsJson(serviceAccountJson());
        TranslationProbeView unconfigured = google.testConnection();
        assertFalse(unconfigured.isCalledProvider());
        assertTrue(scripted.calls.isEmpty());
        assertEquals(AuditionTranslation.ERROR_NOT_CONFIGURED, unconfigured.getErrorCode());

        TranslationSettingsView view = settings.update(request);
        assertEquals(GoogleCloudTranslationProvider.PROVIDER_ID, view.getActiveProvider());
        assertTrue(view.isGoogleCredentialsConfigured());
        assertEquals("demo-project", view.getGoogleProjectId());
        assertFalse(String.valueOf(view.getGoogleModel()).contains("PRIVATE"));
        String providerColumn = jdbc.queryForObject(
                "SELECT provider FROM platform_translation_settings WHERE id = 1", String.class);
        assertEquals(HttpTranslationProvider.PROVIDER_ID, providerColumn);
        String cipher = jdbc.queryForObject(
                "SELECT google_credentials_cipher FROM platform_translation_settings WHERE id = 1", String.class);
        assertFalse(cipher.contains("BEGIN PRIVATE KEY"));
        assertEquals(GoogleCloudTranslationProvider.PROVIDER_ID, provider.providerId());
        scripted.respond(200, "{\"access_token\":\"ya29.mock\",\"expires_in\":3600,\"token_type\":\"Bearer\"}");
        scripted.echoTranslations("EN ");
        UUID id = UUID.randomUUID();
        store.insertPendingJob(new NewJob(UUID.randomUUID(), FIXTURE, id, "en", "hash", null, null, 1, false));
        assertEquals(1, worker.drain());
        Integer characters = jdbc.queryForObject(
                "SELECT billed_characters FROM content_translation_attempts WHERE content_type = ?",
                Integer.class, FIXTURE);
        assertTrue(characters != null && characters > 0);
        Long cost = jdbc.queryForObject(
                "SELECT estimated_cost_micro_usd FROM content_translation_attempts WHERE content_type = ?",
                Long.class, FIXTURE);
        assertEquals(characters * 20L, cost);
        String body = jdbc.queryForObject(
                "SELECT body::text FROM content_translations WHERE content_type = ? AND content_id = ?",
                String.class, FIXTURE, id);
        assertTrue(body.contains("{name}"));
        assertTrue(body.contains("EN "));
        assertEquals(GoogleServiceAccount.TOKEN_URL, scripted.calls.get(0).url());
        assertTrue(scripted.calls.get(1).url().startsWith("https://translate.googleapis.com/"));
        assertEquals("ya29.mock", scripted.calls.get(1).bearer());

        scripted.respond(200, """
                {"languages":[{"languageCode":"ko"},{"languageCode":"en"},{"languageCode":"mn"}]}
                """);
        TranslationProbeView languages = google.supportedLanguages();
        assertTrue(languages.isCalledProvider());
        assertTrue(languages.isKoreanSupported());
        assertTrue(languages.isEnglishSupported());
        assertTrue(languages.isMongolianSupported());

        TranslationUsageView usage = settings.monthlyUsage(null);
        assertTrue(usage.getAttempts() >= 1);
        assertTrue(usage.getBilledCharacters() >= characters);
        assertTrue(scripted.calls.stream().noneMatch(call -> call.url().contains("localhost")));
    }

    private void clearGoogle() {
        jdbc.update("""
                UPDATE platform_translation_settings
                SET active_provider = 'GOOGLE_CLOUD_TRANSLATION',
                    google_project_id = NULL,
                    google_location = NULL,
                    google_model = NULL,
                    google_credentials_cipher = NULL,
                    google_cost_micro_usd_per_million = NULL
                WHERE id = 1
                """);
    }

    private static String serviceAccountJson() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        String pem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, new byte[] {'\n'}).encodeToString(generator.generateKeyPair().getPrivate().getEncoded())
                + "\n-----END PRIVATE KEY-----\n";
        return new ObjectMapper().createObjectNode()
                .put("type", "service_account")
                .put("client_email", "translator@demo-project.iam.gserviceaccount.com")
                .put("token_uri", "https://oauth2.googleapis.com/token")
                .put("private_key", pem)
                .toString();
    }

    @TestConfiguration
    static class MockGoogle {
        @Bean
        @Primary
        ScriptedTranslationTransport scriptedTranslationTransport() {
            return new ScriptedTranslationTransport();
        }

        @Bean
        ContentTranslationSource googleFixture() {
            return new ContentTranslationSource() {
                @Override
                public String type() {
                    return FIXTURE;
                }

                @Override
                public Optional<ContentSnapshot> load(UUID contentId) {
                    return Optional.of(new ContentSnapshot(
                            type(), contentId, "ko", Map.of("introText", "안녕 {name}"), null, null));
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
}
