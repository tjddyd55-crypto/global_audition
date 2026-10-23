package com.audition.platform.application.publicview;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
class PublicAgencyServiceIT {

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PublicAgencyService agencies;

    @AfterEach
    void cleanup() {
        jdbc.update("DELETE FROM auditions WHERE title = 'public-platform-qa'");
        jdbc.update("DELETE FROM crm_agencies WHERE display_name = 'public-platform-qa'");
        jdbc.update("DELETE FROM users WHERE email = 'public-platform-qa@local.test'");
    }

    @Test
    void approvedAgencyShowsOpenAuditionsAndHidesContactAndPendingRows() {
        UUID owner = UUID.randomUUID();
        UUID approved = UUID.randomUUID();
        UUID pending = UUID.randomUUID();
        UUID open = UUID.randomUUID();
        UUID closed = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, 'public-platform-qa@local.test', 'x', 'AGENCY', 'publicqa', 'Public QA', 'Public QA', 'JP')
                """, owner);
        insertAgency(approved, owner, "APPROVED", "secret-approved@example.com");
        insertAgency(pending, owner, "PENDING", "secret-pending@example.com");
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, posting_branch_id, group_id)
                VALUES (?, ?, 'public-platform-qa', 'desc', 'OPEN', 'JP', ?, ?)
                """, open, owner, approved, open);
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, posting_branch_id, group_id)
                VALUES (?, ?, 'public-platform-qa', 'desc', 'CLOSED', 'JP', ?, ?)
                """, closed, owner, approved, closed);

        assertTrue(agencies.list().stream().anyMatch(row -> approved.toString().equals(row.id()) && row.openAuditionCount() >= 1));
        assertTrue(agencies.list().stream().noneMatch(row -> pending.toString().equals(row.id())));
        PublicAgencyService.PublicAgencyDetail detail = agencies.get(approved);
        assertEquals("https://agency.example", detail.website());
        assertEquals(1, detail.auditions().size());
        assertEquals(open.toString(), detail.auditions().get(0).id());
        assertEquals("OPEN", detail.auditions().get(0).status());
        ResponseStatusException hidden = assertThrows(ResponseStatusException.class, () -> agencies.get(pending));
        assertEquals(404, hidden.getStatusCode().value());
    }

    private void insertAgency(UUID id, UUID owner, String approval, String secretEmail) {
        jdbc.update("""
                INSERT INTO crm_agencies (
                    id, country_code, display_name, legal_name, contact_email, website, stage, approval_state, linked_user_id, notes
                ) VALUES (?, 'JP', 'public-platform-qa', 'Hidden Legal', ?, 'https://agency.example', 'ACTIVE', ?, ?, 'hidden note')
                """, id, secretEmail, approval, owner);
    }
}
