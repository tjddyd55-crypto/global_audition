package com.audition.platform.application.vote;

import com.audition.platform.api.dto.PublicVoteItemDto;
import com.audition.platform.api.dto.StartVoteRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 후보별 공유 링크: 후보 우선 표시, 회차 고정, 식별자 변조, 본인 공유 정보. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class VoteShareIT {

    private static final String TITLE = "vote-share-it";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private PublicVoteService votes;
    @Autowired private PublicVoteScheduleService schedule;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        String a = "(SELECT id FROM auditions WHERE title = '" + TITLE + "')";
        jdbc.update("DELETE FROM votes WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN " + a + ")");
        jdbc.update("DELETE FROM audition_vote_candidates WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM applications WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM auditions WHERE title = '" + TITLE + "'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@vote.share.it'");
    }

    @Test
    void sharedCandidateIsShownFirstWithoutChangingRankOrVotes() {
        UUID owner = user();
        UUID audition = audition(owner, "SINGLE", 1, null);
        List<UUID> apps = new ArrayList<>();
        for (int i = 0; i < 5; i++) apps.add(application(audition, user(), 1));
        start(owner, audition, Instant.now().minusSeconds(30), Instant.now().plus(1, ChronoUnit.HOURS), apps);
        UUID a = apps.get(0), b = apps.get(1), e = apps.get(4);

        SecurityContextHolder.clearContext();
        var plain = votes.getPublicVotes(audition, null);
        List<String> base = plain.getItems().stream().map(PublicVoteItemDto::getApplicationId).toList();
        assertEquals(5, base.size());
        assertEquals(List.of(1, 2, 3, 4, 5), plain.getItems().stream().map(PublicVoteItemDto::getCandidateNumber).toList());

        for (UUID target : List.of(a, b, e)) {
            var page = votes.getPublicVotes(audition, null, 1, target);
            assertEquals(target.toString(), page.getItems().get(0).getApplicationId());
            assertEquals(target.toString(), page.getSharedCandidate().getApplicationId());
            assertEquals(apps.indexOf(target) + 1, page.getSharedCandidate().getCandidateNumber());
            assertEquals(5, page.getItems().size(), "명단은 그대로");
            assertTrue(page.isVotingEnabled());
        }

        // 공유 링크로 들어와도 표는 버튼을 눌러야만 생긴다.
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM votes WHERE audition_id = ?", Integer.class, audition));
        UUID voter = user();
        asRole(voter, "ROLE_USER");
        votes.castVote(audition, b);
        assertFalse(votes.castVote(audition, b).isReplaced(), "같은 후보 반복 요청은 1표로 유지");
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM votes WHERE audition_id = ?", Integer.class, audition));
        assertEquals(b.toString(), votes.getPublicVotes(audition, null, 1, a).getMyVoteApplicationId());
        assertEquals(2, votes.getPublicVotes(audition, null, 1, b).getSharedCandidate().getCandidateNumber());
    }

    @Test
    void subsetBallotNumbersAreIndependentAndRestartInANewRound() {
        UUID owner = user();
        UUID audition = audition(owner, "MULTI_ROUND", 1, "{1,2}");
        List<UUID> apps = new ArrayList<>();
        for (int i = 0; i < 5; i++) apps.add(application(audition, user(), 1));
        UUID b = apps.get(1), e = apps.get(4);
        start(owner, audition, Instant.now().minusSeconds(30), Instant.now().plus(1, ChronoUnit.HOURS), List.of(e, b));
        SecurityContextHolder.clearContext();
        var first = votes.getPublicVotes(audition, null, 1, b);
        assertEquals(2, first.getSharedCandidate().getCandidateNumber());
        assertEquals(1, votes.getPublicVotes(audition, null, 1, e).getSharedCandidate().getCandidateNumber());
        assertEquals(5, jdbc.queryForObject("SELECT entry_number FROM application_entry_numbers WHERE application_id = ? AND round_number = 0", Integer.class, e));
        jdbc.update("UPDATE auditions SET current_round_number = 2 WHERE id = ?", audition);
        jdbc.update("UPDATE applications SET current_round_number = 2 WHERE id = ?", b);
        start(owner, audition, Instant.now().minusSeconds(10), Instant.now().plus(1, ChronoUnit.HOURS), List.of(b));
        SecurityContextHolder.clearContext();
        assertEquals(1, votes.getPublicVotes(audition, null, 2, b).getSharedCandidate().getCandidateNumber());
        assertEquals(2, votes.getPublicVotes(audition, null, 1, b).getSharedCandidate().getCandidateNumber());
    }

    @Test
    void tamperedCandidateDoesNotLeakNonCandidatesOrOtherAuditions() {
        UUID owner = user();
        UUID audition = audition(owner, "SINGLE", 1, null);
        UUID cand = application(audition, user(), 1);
        UUID notConfirmed = application(audition, user(), 1);
        UUID otherAudition = audition(owner, "SINGLE", 1, null);
        UUID foreign = application(otherAudition, user(), 1);
        start(owner, audition, Instant.now().minusSeconds(30), Instant.now().plus(1, ChronoUnit.HOURS), List.of(cand));
        SecurityContextHolder.clearContext();

        for (UUID bad : List.of(notConfirmed, foreign, UUID.randomUUID())) {
            var page = votes.getPublicVotes(audition, null, 1, bad);
            assertNull(page.getSharedCandidate());
            assertTrue(page.getItems().stream().noneMatch(i -> i.getApplicationId().equals(bad.toString())));
            assertEquals(1, page.getItems().size());
        }
    }

    @Test
    void roundLinksStayFixedAcrossRounds() {
        UUID owner = user();
        UUID audition = audition(owner, "MULTI_ROUND", 3, "{3,4}");
        UUID a = application(audition, user(), 3);
        UUID b = application(audition, user(), 3);
        start(owner, audition, Instant.now().minusSeconds(60), Instant.now().plus(1, ChronoUnit.HOURS), List.of(a, b));
        SecurityContextHolder.clearContext();
        var r3 = votes.getPublicVotes(audition, null, 3, a);
        assertEquals("OPEN", r3.getVoteStatus());
        assertEquals(3, r3.getRoundNumber());
        assertEquals(1, r3.getSharedCandidate().getCandidateNumber());

        // 4차로 진행: a 만 진출, 4차 투표 시작.
        jdbc.update("UPDATE auditions SET current_round_number = 4 WHERE id = ?", audition);
        jdbc.update("UPDATE applications SET current_round_number = 4 WHERE id = ?", a);
        start(owner, audition, Instant.now().minusSeconds(10), Instant.now().plus(1, ChronoUnit.HOURS), List.of(a));
        SecurityContextHolder.clearContext();

        var old = votes.getPublicVotes(audition, null, 3, a);
        assertEquals(3, old.getRoundNumber(), "3차 링크는 4차로 바뀌지 않는다");
        assertEquals("CLOSED", old.getVoteStatus());
        assertFalse(old.isVotingEnabled());
        assertEquals(2, old.getItems().size(), "3차 확정 명단");
        assertEquals(a.toString(), old.getSharedCandidate().getApplicationId());

        var oldB = votes.getPublicVotes(audition, null, 3, b);
        assertEquals(b.toString(), oldB.getSharedCandidate().getApplicationId());
        assertEquals(2, oldB.getSharedCandidate().getCandidateNumber());
        var newB = votes.getPublicVotes(audition, null, 4, b);
        assertNull(newB.getSharedCandidate(), "4차 비후보는 4차 링크에서 보이지 않는다");
        assertTrue(newB.getItems().stream().noneMatch(i -> i.getApplicationId().equals(b.toString())));

        var r4 = votes.getPublicVotes(audition, null, 4, a);
        assertEquals("OPEN", r4.getVoteStatus());
        assertTrue(r4.isVotingEnabled());
        assertEquals(1, r4.getSharedCandidate().getCandidateNumber());

        var r5 = votes.getPublicVotes(audition, null, 5, a);
        assertEquals("NOT_STARTED", r5.getVoteStatus());
        assertNull(r5.getSharedCandidate());
        assertTrue(r5.getItems().isEmpty());
    }

    @Test
    void scheduledShowsSharedCandidateButCannotVote() {
        UUID owner = user();
        UUID audition = audition(owner, "SINGLE", 1, null);
        UUID a = application(audition, user(), 1);
        start(owner, audition, Instant.now().plus(1, ChronoUnit.HOURS), Instant.now().plus(2, ChronoUnit.HOURS), List.of(a));
        SecurityContextHolder.clearContext();
        var page = votes.getPublicVotes(audition, null, 1, a);
        assertEquals("SCHEDULED", page.getVoteStatus());
        assertFalse(page.isVotingEnabled());
        assertEquals(a.toString(), page.getSharedCandidate().getApplicationId());
        asRole(user(), "ROLE_USER");
        assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, a));
    }

    @Test
    void myVoteShareOnlyForConfirmedCandidateOwner() {
        UUID owner = user();
        UUID applicantA = user(), applicantB = user();
        UUID audition = audition(owner, "SINGLE", 1, null);
        UUID a = application(audition, applicantA, 1);
        UUID b = application(audition, applicantB, 1);
        asRole(applicantA, "ROLE_APPLICANT");
        assertFalse(schedule.myVoteShare(a).isCandidate(), "시작 전에는 공유 링크 없음");

        start(owner, audition, Instant.now().minusSeconds(10), Instant.now().plus(1, ChronoUnit.HOURS), List.of(a));
        asRole(applicantA, "ROLE_APPLICANT");
        var mine = schedule.myVoteShare(a);
        assertTrue(mine.isCandidate());
        assertEquals(1, mine.getCandidateNumber());
        assertEquals(1, mine.getRoundNumber());
        assertEquals("OPEN", mine.getVoteStatus());

        asRole(applicantB, "ROLE_APPLICANT");
        assertFalse(schedule.myVoteShare(b).isCandidate(), "확정되지 않은 지원은 공유 링크 없음");
        assertThrows(ResponseStatusException.class, () -> schedule.myVoteShare(a), "남의 지원은 볼 수 없음");
    }

    private void start(UUID owner, UUID audition, Instant startAt, Instant endAt, List<UUID> apps) {
        asRole(owner, "ROLE_AGENCY");
        StartVoteRequest req = new StartVoteRequest();
        req.setStartAt(startAt.toString());
        req.setEndAt(endAt.toString());
        req.setApplicationIds(apps.stream().map(UUID::toString).toList());
        schedule.start(audition, req);
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "h" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'USER', ?, ?, ?, 'KR')
                """, id, handle + "@vote.share.it", handle, handle, handle);
        return id;
    }

    private UUID audition(UUID owner, String mode, int current, String plan) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id,
                                       process_mode, current_round_number, max_round_number, voting_rounds)
                VALUES (?, ?, ?, 'desc', 'OPEN', 'KR', ?, ?, ?, ?, ?::int[])
                """, id, owner, TITLE, id, mode, current, Math.max(current, 4), plan);
        return id;
    }

    private UUID application(UUID auditionId, UUID applicantId, int round) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO applications (id, audition_id, applicant_id, status, current_round_number) VALUES (?, ?, ?, 'SUBMITTED', ?)",
                id, auditionId, applicantId, round);
        return id;
    }

    private static void asRole(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority(role))));
    }
}
