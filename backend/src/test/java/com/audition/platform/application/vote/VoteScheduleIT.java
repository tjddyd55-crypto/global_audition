package com.audition.platform.application.vote;

import com.audition.platform.api.dto.StartVoteRequest;
import com.audition.platform.application.AuditionService;
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

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
class VoteScheduleIT {

    private static final String TITLE = "vote-schedule-it";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private PublicVoteService votes;
    @Autowired private PublicVoteScheduleService schedule;
    @Autowired private AuditionService auditions;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        String a = "(SELECT id FROM auditions WHERE title = '" + TITLE + "')";
        jdbc.update("DELETE FROM votes WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN " + a + ")");
        jdbc.update("DELETE FROM audition_vote_candidates WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM applications WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM auditions WHERE title = '" + TITLE + "'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@vote.schedule.it'");
    }

    @Test
    void unstartedAndEmptyAreHiddenFromPublicListAndCannotBeCast() {
        UUID owner = user();
        UUID audition = audition(owner);
        UUID app = application(audition, user());
        assertTrue(auditions.listOpenPublicVotes("KR").stream().noneMatch(r -> r.getId().equals(audition)));
        var page = votes.getPublicVotes(audition, null);
        assertEquals("NOT_STARTED", page.getVoteStatus());
        assertFalse(page.isVotingEnabled());
        assertTrue(page.getItems().isEmpty());
        asRole(user(), "ROLE_USER");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, app));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void startWithNoCandidatesIsRejected() {
        UUID owner = user();
        UUID audition = audition(owner);
        asRole(owner, "ROLE_AGENCY");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> start(audition, Instant.now().minusSeconds(10), Instant.now().plus(1, ChronoUnit.HOURS)));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatusCode());
    }

    @Test
    void openWindowAppearsInListAndAcceptsVotesUntilEnd() {
        UUID owner = user(), voter = user();
        UUID audition = audition(owner);
        UUID first = application(audition, user());
        UUID second = application(audition, user());
        asRole(owner, "ROLE_AGENCY");
        var started = start(audition, Instant.now().minusSeconds(30), Instant.now().plus(2, ChronoUnit.HOURS), first);
        assertEquals("OPEN", started.getVoteStatus());
        assertEquals(1, started.getCandidateCount());
        assertTrue(auditions.listOpenPublicVotes("KR").stream().anyMatch(r -> r.getId().equals(audition)));

        asRole(voter, "ROLE_USER");
        var page = votes.getPublicVotes(audition, null);
        assertTrue(page.isVotingEnabled());
        assertEquals(1, page.getItems().size());
        assertEquals(first.toString(), page.getItems().get(0).getApplicationId());
        votes.castVote(audition, first);
        ResponseStatusException notCandidate = assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, second));
        assertEquals(HttpStatus.BAD_REQUEST, notCandidate.getStatusCode());

        jdbc.update("UPDATE auditions SET vote_end_at = ? WHERE id = ?", Timestamp.from(Instant.now().minusSeconds(1)), audition);
        assertTrue(auditions.listOpenPublicVotes("KR").stream().noneMatch(r -> r.getId().equals(audition)));
        var closed = votes.getPublicVotes(audition, null);
        assertEquals("CLOSED", closed.getVoteStatus());
        assertFalse(closed.isVotingEnabled());
        assertEquals(1, closed.getItems().size());
        assertEquals(1L, closed.getSummary().getTotalVotes());
        assertEquals(1L, closed.getAudition().getTotalVotes());
        assertEquals(1L, closed.getItems().get(0).getVoteCount());
        assertEquals(first.toString(), closed.getMyVoteApplicationId());
        assertTrue(closed.getItems().get(0).isVoted());
        ResponseStatusException ended = assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, first));
        assertEquals(HttpStatus.CONFLICT, ended.getStatusCode());
        assertTrue(ended.getReason() == null || ended.getReason().contains("종료") || ended.getMessage().contains("종료"));
    }

    @Test
    void scheduledIsNotListedOrVotableUntilStartInstant() {
        UUID owner = user(), voter = user();
        UUID audition = audition(owner);
        UUID app = application(audition, user());
        asRole(owner, "ROLE_AGENCY");
        var scheduled = start(audition, Instant.now().plus(1, ChronoUnit.HOURS), Instant.now().plus(3, ChronoUnit.HOURS), app);
        assertEquals("SCHEDULED", scheduled.getVoteStatus());
        assertTrue(auditions.listOpenPublicVotes("KR").stream().noneMatch(r -> r.getId().equals(audition)));
        asRole(voter, "ROLE_USER");
        var page = votes.getPublicVotes(audition, null);
        assertEquals("SCHEDULED", page.getVoteStatus());
        assertFalse(page.isVotingEnabled());
        assertTrue(page.getItems().isEmpty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, app));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    @Test
    void cannotRestartSameRoundWhileOpen() {
        UUID owner = user();
        UUID audition = audition(owner);
        UUID app = application(audition, user());
        asRole(owner, "ROLE_AGENCY");
        start(audition, Instant.now().minusSeconds(10), Instant.now().plus(1, ChronoUnit.HOURS), app);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> start(audition, Instant.now().minusSeconds(10), Instant.now().plus(2, ChronoUnit.HOURS), app));
        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
    }

    private com.audition.platform.api.dto.VoteScheduleDto start(UUID audition, Instant startAt, Instant endAt, UUID... apps) {
        StartVoteRequest req = new StartVoteRequest();
        req.setStartAt(startAt.toString());
        req.setEndAt(endAt.toString());
        if (apps != null && apps.length > 0) {
            req.setApplicationIds(java.util.Arrays.stream(apps).map(UUID::toString).toList());
        }
        return schedule.start(audition, req);
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "s" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'USER', ?, ?, ?, 'KR')
                """, id, handle + "@vote.schedule.it", handle, handle, handle);
        return id;
    }

    private UUID audition(UUID owner) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id)
                VALUES (?, ?, ?, 'desc', 'OPEN', 'KR', ?)
                """, id, owner, TITLE, id);
        return id;
    }

    private UUID application(UUID auditionId, UUID applicantId) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO applications (id, audition_id, applicant_id, status) VALUES (?, ?, ?, 'SUBMITTED')",
                id, auditionId, applicantId);
        return id;
    }

    private static void asRole(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority(role))));
    }
}
