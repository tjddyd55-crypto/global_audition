package com.audition.platform.application.i18n;

import com.audition.platform.domain.audition.Audition;
import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 원문이 번역의 기준 해시와 다시 같아지면 그 언어만 stale 을 풀고 본문을 재사용한다.
 * 값이 같은 저장은 updated_at 을 바꾸지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class TranslationStaleReuseIT {

    private static final Instant FROZEN = Instant.parse("2020-01-01T00:00:00Z");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        TestDatabase.register(registry);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        registry.add("app.jwt.secret", () -> Base64.getUrlEncoder().withoutPadding().encodeToString(key));
        registry.add("app.translation.queue.enabled", () -> "false");
        registry.add("app.super-admin.bootstrap-enabled", () -> "false");
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private JwtService jwt;

    private UUID ownerId;
    private UUID auditionId;
    private String token;

    @BeforeEach
    void setUp() {
        ownerId = user();
        auditionId = audition(ownerId);
        token = "Bearer " + jwt.createToken(ownerId, "owner@stale.reuse.test", "AGENCY");
    }

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM content_translation_jobs WHERE content_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@stale.reuse.test'))");
        jdbc.update("DELETE FROM content_translations WHERE content_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@stale.reuse.test'))");
        jdbc.update("DELETE FROM audition_translations WHERE audition_id IN (SELECT id FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@stale.reuse.test'))");
        jdbc.update("DELETE FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@stale.reuse.test')");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@stale.reuse.test'");
    }

    @Test
    void sameSaveSkipsUpdatedAtAndRevertClearsOnlyTheMatchingLocale() throws Exception {
        Audition original = probe("원문 제목");
        Audition edited = probe("새 제목");
        String originalFields = SourceFieldHashes.ofAudition(original);
        String editedFields = SourceFieldHashes.ofAudition(edited);
        translation("en", "English title", originalFields, true);
        translation("mn", "Монгол гарчиг", editedFields, false);
        freeze();

        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"title\":\"원문 제목\",\"description\":\"원문 본문\"}"))
                .andExpect(status().isOk());
        assertEquals(FROZEN, updatedAudition());
        assertEquals(FROZEN, updatedTranslation("en"));
        assertEquals(FROZEN, updatedTranslation("mn"));

        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"title\":\"새 제목\",\"description\":\"원문 본문\"}"))
                .andExpect(status().isOk());
        assertStale("en", true, "English title");
        assertStale("mn", false, "Монгол гарчиг");
        assertEquals(FROZEN, updatedTranslation("mn"));

        mvc.perform(patch("/api/auditions/" + auditionId).header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{\"title\":\"원문 제목\",\"description\":\"원문 본문\"}"))
                .andExpect(status().isOk());
        assertStale("en", false, "English title");
        assertStale("mn", true, "Монгол гарчиг");

        Instant beforeRepeat = updatedTranslation("en");
        mvc.perform(put("/api/auditions/" + auditionId + "/translations/en")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"English title\",\"description\":\"English body\"}"))
                .andExpect(status().isOk());
        assertEquals(beforeRepeat, updatedTranslation("en"));
        assertFalse(stale("en"));
    }

    private void assertStale(String locale, boolean stale, String title) {
        assertEquals(stale, stale(locale));
        assertEquals(title, jdbc.queryForObject(
                "SELECT title FROM audition_translations WHERE audition_id = ? AND locale = ?",
                String.class, auditionId, locale));
    }

    private boolean stale(String locale) {
        Boolean value = jdbc.queryForObject(
                "SELECT stale FROM audition_translations WHERE audition_id = ? AND locale = ?",
                Boolean.class, auditionId, locale);
        return Boolean.TRUE.equals(value);
    }

    private Instant updatedAudition() {
        return jdbc.queryForObject("SELECT updated_at FROM auditions WHERE id = ?", Timestamp.class, auditionId).toInstant();
    }

    private Instant updatedTranslation(String locale) {
        return jdbc.queryForObject(
                "SELECT updated_at FROM audition_translations WHERE audition_id = ? AND locale = ?",
                Timestamp.class, auditionId, locale).toInstant();
    }

    private void freeze() {
        jdbc.update("UPDATE auditions SET updated_at = ? WHERE id = ?", Timestamp.from(FROZEN), auditionId);
        jdbc.update("UPDATE audition_translations SET updated_at = ? WHERE audition_id = ?", Timestamp.from(FROZEN), auditionId);
    }

    private static Audition probe(String title) {
        Audition audition = new Audition();
        audition.setTitle(title);
        audition.setDescription("원문 본문");
        audition.setDefaultLocale("ko");
        return audition;
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "owner" + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname)
                VALUES (?, ?, 'x', 'AGENCY', ?, ?, ?)
                """, id, handle + "@stale.reuse.test", handle, handle, handle);
        return id;
    }

    private UUID audition(UUID owner) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (
                    id, owner_id, title, description, status, country_code, group_id, default_locale,
                    content_revision, image_original_url, cover_image
                )
                VALUES (?, ?, '원문 제목', '원문 본문', 'OPEN', 'KR', ?, 'ko', 1, 'https://cdn.example/cover.jpg', 'https://cdn.example/cover.jpg')
                """, id, owner, id);
        return id;
    }

    private void translation(String locale, String title, String fieldHashes, boolean manual) {
        jdbc.update("""
                INSERT INTO audition_translations (
                    audition_id, locale, title, description, status, provider, origin, manually_edited, stale,
                    source_field_hashes, source_hash
                ) VALUES (?, ?, ?, 'English body', 'COMPLETED', 'MANUAL', ?, ?, false, ?, ?)
                """, auditionId, locale, title, manual ? "MANUAL" : "AUTO", manual, fieldHashes,
                AuditionSourceFingerprint.hash(probe("원문 제목")));
    }
}
