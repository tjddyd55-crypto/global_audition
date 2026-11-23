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

import com.audition.platform.api.dto.StartVoteRequest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.audition.platform.application.ranking.AuditionRankingQueryService;
import org.springframework.web.server.ResponseStatusException;

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
    @Autowired
    private AuditionRankingQueryService ranking;
    @Autowired
    private PublicVoteScheduleService schedule;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM votes WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression')");
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression'))");
        jdbc.update("DELETE FROM audition_vote_candidates WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'vote-regression')");
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
        startOpen(owner, audition, first, second);
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

    @Test
    void roundWithVotingDisabledRejectsNewVotesKeepsOldOnesAndRankingIsDisabledNotError() {
        UUID voter = user();
        UUID owner = user();
        UUID applicant = user();
        UUID audition = audition(owner);
        UUID app = application(audition, applicant);
        startOpen(owner, audition, app);
        asUser(voter);
        votes.castVote(audition, app);
        assertEquals(1L, voteCount(app));

        // 3차만 투표: 현재(시리즈 1차)는 투표 없음으로 바꾼다. 기존 투표는 지우지 않는다.
        jdbc.update("UPDATE auditions SET voting_round_count = 3, voting_rounds = '{3}' WHERE id = ?", audition);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, app));
        assertEquals(409, ex.getStatusCode().value());
        assertEquals("VOTING_DISABLED_FOR_ROUND", ex.getReason());
        assertEquals(1L, voteCount(app));
        assertEquals(1, count("SELECT COUNT(*) FROM votes WHERE audition_id = '" + audition + "'"));

        var page = votes.getPublicVotes(audition, null);
        assertFalse(page.isVotingEnabled());
        assertTrue(page.getItems().isEmpty());

        asOwner(owner);
        var board = ranking.getRanking(audition);
        assertFalse(board.isVotingEnabled());
        assertTrue(board.getItems().isEmpty());

        // 다시 켜면 그대로 보인다.
        jdbc.update("UPDATE auditions SET voting_rounds = '{1,2,3}' WHERE id = ?", audition);
        assertTrue(ranking.getRanking(audition).isVotingEnabled());
        asUser(voter);
        assertTrue(votes.getPublicVotes(audition, null).isVotingEnabled());
        assertEquals(1, votes.getPublicVotes(audition, null).getItems().size());
    }

    @Test
    void legacyAuditionWithoutPlanStillVotes() {
        UUID voter = user();
        UUID owner = user();
        UUID applicant = user();
        UUID audition = audition(owner);
        UUID app = application(audition, applicant);
        Integer plan = jdbc.queryForObject("SELECT COUNT(*) FROM auditions WHERE id = ? AND voting_rounds IS NULL", Integer.class, audition);
        assertEquals(1, plan);
        startOpen(owner, audition, app);
        asUser(voter);
        votes.castVote(audition, app);
        assertTrue(votes.getPublicVotes(audition, null).isVotingEnabled());
    }

    private void startOpen(UUID owner, UUID audition, UUID... apps) {
        asOwner(owner);
        StartVoteRequest req = new StartVoteRequest();
        Instant now = Instant.now();
        req.setStartAt(now.minusSeconds(30).toString());
        req.setEndAt(now.plus(2, ChronoUnit.HOURS).toString());
        req.setApplicationIds(Arrays.stream(apps).map(UUID::toString).toList());
        schedule.start(audition, req);
    }

    private static void asOwner(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_AGENCY"))));
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
