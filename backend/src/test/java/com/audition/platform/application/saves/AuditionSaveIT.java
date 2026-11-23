package com.audition.platform.application.saves;

import com.audition.platform.api.dto.saves.AuditionSaveItemResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class AuditionSaveIT {

    private static final String MARK = "save-audition-qa";
    private static final String EMAIL_SUFFIX = "@save.audition.test";

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private AuditionSaveService saves;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM audition_saves WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)",
                "%" + EMAIL_SUFFIX);
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title LIKE ?)",
                MARK + "%");
        jdbc.update("DELETE FROM auditions WHERE title LIKE ?", MARK + "%");
        jdbc.update("DELETE FROM users WHERE email LIKE ?", "%" + EMAIL_SUFFIX);
    }

    @Test
    void saveIsIdempotentMaskedWhenUnlistedAndIndependentOfApplications() {
        UUID applicant = user("applicant");
        UUID other = user("other");
        UUID owner = user("owner");
        UUID openId = audition(owner, MARK + "-open", "OPEN", null);
        UUID closedId = audition(owner, MARK + "-closed", "CLOSED", null);
        UUID upcomingId = audition(owner, MARK + "-upcoming", "OPEN", Instant.now().plus(10, ChronoUnit.DAYS));
        UUID draftId = audition(owner, MARK + "-draft", "DRAFT", null);
        UUID laterHidden = audition(owner, MARK + "-hidden", "OPEN", null);

        asUser(applicant);
        AuditionSaveItemResponse first = saves.save(openId);
        assertEquals(openId, first.getAuditionId());
        assertTrue(first.isAvailable());
        assertEquals("OPEN", first.getRecruitmentStatus());
        assertEquals(MARK + "-open", first.getTitle());

        saves.save(openId);
        assertEquals(1, countSaves(applicant, openId));

        saves.save(closedId);
        saves.save(upcomingId);
        assertEquals("CLOSED", find(saves.list(), closedId).getRecruitmentStatus());
        assertEquals("UPCOMING", find(saves.list(), upcomingId).getRecruitmentStatus());

        ResponseStatusException draft = assertThrows(ResponseStatusException.class, () -> saves.save(draftId));
        assertEquals(HttpStatus.NOT_FOUND, draft.getStatusCode());

        saves.save(laterHidden);
        jdbc.update("UPDATE auditions SET status = 'DRAFT' WHERE id = ?", laterHidden);
        AuditionSaveItemResponse hidden = find(saves.list(), laterHidden);
        assertFalse(hidden.isAvailable());
        assertEquals("UNAVAILABLE", hidden.getRecruitmentStatus());
        assertNull(hidden.getTitle());
        assertNull(hidden.getAgencyName());
        assertNull(hidden.getCoverImage());

        UUID gone = audition(owner, MARK + "-gone", "OPEN", null);
        saves.save(gone);
        jdbc.update("DELETE FROM auditions WHERE id = ?", gone);
        AuditionSaveItemResponse missing = find(saves.list(), gone);
        assertFalse(missing.isAvailable());
        assertEquals("UNAVAILABLE", missing.getRecruitmentStatus());
        assertNull(missing.getTitle());

        jdbc.update("INSERT INTO applications (id, audition_id, applicant_id, status) VALUES (?, ?, ?, 'SUBMITTED')",
                UUID.randomUUID(), openId, applicant);
        saves.unsave(openId);
        assertEquals(0, countSaves(applicant, openId));
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM applications WHERE audition_id = ? AND applicant_id = ?",
                Integer.class, openId, applicant).intValue());

        asUser(other);
        assertTrue(saves.list().isEmpty());
        assertTrue(saves.ids().getIds().isEmpty());

        asUser(applicant);
        List<UUID> ids = saves.ids().getIds();
        assertEquals(4, ids.size());
        assertTrue(ids.contains(closedId));
        assertTrue(ids.contains(upcomingId));
        assertTrue(ids.contains(laterHidden));
        assertTrue(ids.contains(gone));
        assertFalse(ids.contains(openId));

        SecurityContextHolder.clearContext();
        ResponseStatusException guest = assertThrows(ResponseStatusException.class, () -> saves.list());
        assertEquals(HttpStatus.UNAUTHORIZED, guest.getStatusCode());
    }

    private int countSaves(UUID userId, UUID auditionId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM audition_saves WHERE user_id = ? AND audition_id = ?",
                Integer.class, userId, auditionId);
        return n == null ? 0 : n;
    }

    private static AuditionSaveItemResponse find(List<AuditionSaveItemResponse> rows, UUID id) {
        return rows.stream().filter(r -> id.equals(r.getAuditionId())).findFirst().orElseThrow();
    }

    private UUID user(String label) {
        UUID id = UUID.randomUUID();
        String handle = label + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'APPLICANT', ?, ?, ?, 'KR')
                """, id, handle + EMAIL_SUFFIX, handle, handle, handle);
        return id;
    }

    private UUID audition(UUID owner, String title, String status, Instant start) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id, agency_name, start_date)
                VALUES (?, ?, ?, 'desc', ?, 'KR', ?, 'QA Agency', ?)
                """, id, owner, title, status, id, start == null ? null : java.sql.Timestamp.from(start));
        return id;
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));
    }
}
