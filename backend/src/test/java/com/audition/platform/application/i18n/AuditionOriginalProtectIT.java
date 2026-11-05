package com.audition.platform.application.i18n;

import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 편집 저장이 번역문을 원문 컬럼에 덮어쓰지 않는지 실제 DB 로 확인한다.
 * 증거로 남겨 둔 깨진 오디션 행은 조회·수정하지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuditionOriginalProtectIT {

    private static final UUID EVIDENCE_AUDITION = UUID.fromString("6020a075-100a-4829-97bf-729b64d24104");

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
    @Autowired
    private AuditionAutoTranslationService autoTranslation;

    private UUID ownerId;
    private UUID auditionId;
    private String token;

    @BeforeEach
    void setUp() {
        ownerId = user();
        auditionId = audition(ownerId);
        translation(auditionId, "en", "English title", "English body", true);
        translation(auditionId, "mn", "Монгол гарчиг", "Монгол тайлбар", false);
        token = "Bearer " + jwt.createToken(ownerId, "owner@original.protect.test", "AGENCY");
        assertFalse(EVIDENCE_AUDITION.equals(auditionId));
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("""
                DELETE FROM audition_translations
                WHERE audition_id IN (
                    SELECT id FROM auditions
                    WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@original.protect.test')
                )
                """);
        jdbc.update("""
                DELETE FROM auditions
                WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@original.protect.test')
                """);
        jdbc.update("DELETE FROM users WHERE email LIKE '%@original.protect.test'");
    }

    @Test
    void openAndSaveInEachLocaleLeavesOriginalAndTranslations() throws Exception {
        assertOriginal("원문 제목", "원문 본문");
        save("원문 제목", "원문 본문");
        save("English title", "English body");
        save("Монгол гарчиг", "Монгол тайлбар");
        assertOriginal("원문 제목", "원문 본문");
        assertTranslation("en", "English title", "English body", false);
        assertTranslation("mn", "Монгол гарчиг", "Монгол тайлбар", false);
        assertEquals(1L, revision());
    }

    @Test
    void publicLocaleShowsTranslationWhileOriginalEndpointStaysSource() throws Exception {
        mvc.perform(get("/api/auditions/" + auditionId + "/original").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("원문 제목"))
                .andExpect(jsonPath("$.description").value("원문 본문"))
                .andExpect(jsonPath("$.originalContent.title").value("원문 제목"))
                .andExpect(jsonPath("$.showingOriginal").value(true));
        mvc.perform(get("/api/auditions/" + auditionId).header("X-Content-Locale", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("English title"))
                .andExpect(jsonPath("$.description").value("English body"))
                .andExpect(jsonPath("$.originalContent.title").value("원문 제목"))
                .andExpect(jsonPath("$.translationContent.title").value("English title"));
        mvc.perform(get("/api/auditions/" + auditionId).header("X-Content-Locale", "mn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Монгол гарчиг"))
                .andExpect(jsonPath("$.originalContent.description").value("원문 본문"));
    }

    @Test
    void translationEditChangesOnlyThatLocale() throws Exception {
        mvc.perform(put("/api/auditions/" + auditionId + "/translations/en")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"Manual English\",\"description\":\"Manual body\"}"))
                .andExpect(status().isOk());
        assertOriginal("원문 제목", "원문 본문");
        assertTranslation("en", "Manual English", "Manual body", false);
        assertTranslation("mn", "Монгол гарчиг", "Монгол тайлбар", false);

        asOwner();
        ResponseStatusException blocked = assertThrows(
                ResponseStatusException.class, () -> autoTranslation.translateLocale(auditionId, "en", false));
        assertEquals(409, blocked.getStatusCode().value());
        assertTranslation("en", "Manual English", "Manual body", false);
        assertOriginal("원문 제목", "원문 본문");
    }

    @Test
    void genuineOriginalEditMarksTranslationsStaleWithoutRewritingManualText() throws Exception {
        mvc.perform(put("/api/auditions/" + auditionId + "/translations/en")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"Manual English\",\"description\":\"Manual body\"}"))
                .andExpect(status().isOk());
        save("새 원문 제목", "원문 본문");
        assertOriginal("새 원문 제목", "원문 본문");
        assertTranslation("en", "Manual English", "Manual body", true);
        assertTranslation("mn", "Монгол гарчиг", "Монгол тайлбар", true);
    }

    private void save(String title, String description) throws Exception {
        mvc.perform(patch("/api/auditions/" + auditionId)
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"description\":\"" + description + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("원문 제목".equals(title) || "새 원문 제목".equals(title) ? title : "원문 제목"));
    }

    private void assertOriginal(String title, String description) {
        String storedTitle = jdbc.queryForObject("SELECT title FROM auditions WHERE id = ?", String.class, auditionId);
        String storedBody = jdbc.queryForObject("SELECT description FROM auditions WHERE id = ?", String.class, auditionId);
        assertEquals(title, storedTitle);
        assertEquals(description, storedBody);
    }

    private void assertTranslation(String locale, String title, String description, boolean stale) {
        String storedTitle = jdbc.queryForObject(
                "SELECT title FROM audition_translations WHERE audition_id = ? AND locale = ?",
                String.class, auditionId, locale);
        String storedBody = jdbc.queryForObject(
                "SELECT description FROM audition_translations WHERE audition_id = ? AND locale = ?",
                String.class, auditionId, locale);
        Boolean storedStale = jdbc.queryForObject(
                "SELECT stale FROM audition_translations WHERE audition_id = ? AND locale = ?",
                Boolean.class, auditionId, locale);
        assertEquals(title, storedTitle);
        assertEquals(description, storedBody);
        assertEquals(stale, Boolean.TRUE.equals(storedStale));
    }

    private long revision() {
        Long value = jdbc.queryForObject("SELECT content_revision FROM auditions WHERE id = ?", Long.class, auditionId);
        return value == null ? 0 : value;
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "owner" + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname)
                VALUES (?, ?, 'x', 'AGENCY', ?, ?, ?)
                """, id, handle + "@original.protect.test", handle, handle, handle);
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

    private void translation(UUID audition, String locale, String title, String description, boolean manual) {
        jdbc.update("""
                INSERT INTO audition_translations (
                    audition_id, locale, title, description, status, provider, origin, manually_edited, stale
                ) VALUES (?, ?, ?, ?, 'COMPLETED', 'MANUAL', ?, ?, false)
                """, audition, locale, title, description, manual ? "MANUAL" : "AUTO", manual);
    }

    private void asOwner() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                ownerId, null, List.of(new SimpleGrantedAuthority("ROLE_AGENCY"))));
    }
}
