package com.audition.platform.application.vote;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class VoteCastRegressionIT {

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PublicVoteService votes;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM votes WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression')");
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression'))");
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression')");
        jdbc.update("DELETE FROM auditions WHERE title = 'vote-regression'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@vote.regression.test'");
    }

    @Test
    void castReplacesPreviousVoteAndRemoveClearsTheCount() {
        UUID voter = user();
        UUID owner = user();
        UUID firstApplicant = user();
        UUID secondApplicant = user();
        UUID audition = audition(owner);
        UUID first = application(audition, firstApplicant);
        UUID second = application(audition, secondApplicant);
        asUser(voter);
        assertFalse(votes.castVote(audition, first).isReplaced());
        assertEquals(1L, voteCount(first));
        assertEquals(second.toString(), votes.castVote(audition, second).getApplicationId());
        assertEquals(0L, voteCount(first));
        assertEquals(1L, voteCount(second));
        assertEquals(1, count("SELECT COUNT(*) FROM votes WHERE audition_id = '" + audition + "' AND user_id = '" + voter + "'"));
        votes.removeVote(second);
        assertEquals(0L, voteCount(second));
        assertEquals(0, count("SELECT COUNT(*) FROM votes WHERE user_id = '" + voter + "'"));
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "v" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'USER', ?, ?, ?, 'KR')
                """, id, handle + "@vote.regression.test", handle, handle, handle);
        return id;
    }

    private UUID audition(UUID owner) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id)
                VALUES (?, ?, 'vote-regression', 'desc', 'OPEN', 'KR', ?)
                """, id, owner, id);
        return id;
    }

    private UUID application(UUID auditionId, UUID applicantId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO applications (id, audition_id, applicant_id, status)
                VALUES (?, ?, ?, 'SUBMITTED')
                """, id, auditionId, applicantId);
        return id;
    }

    private long voteCount(UUID applicationId) {
        Long value = jdbc.queryForObject("SELECT vote_count FROM applications WHERE id = ?", Long.class, applicationId);
        return value == null ? 0 : value;
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }
}
