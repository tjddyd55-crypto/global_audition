package com.audition.platform.application.vote;

import com.audition.platform.api.dto.StartVoteRequest;
import com.audition.platform.application.ranking.AuditionRankingQueryService;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.AuditionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 회차별 투표(오디션·회차당 1표), 공개 랭킹, 회차 API ↔ 공고 투표 설정, V68 기존 투표 매핑. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class PerRoundVoteIT {

    private static final String TITLE = "per-round-vote-it";

    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataSource dataSource;
    @Autowired private PublicVoteService votes;
    @Autowired private AuditionRankingQueryService ranking;
    @Autowired private AuditionRoundService rounds;
    @Autowired private AuditionRepository auditions;
    @Autowired private PublicVoteScheduleService schedule;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        String a = "(SELECT id FROM auditions WHERE title = '" + TITLE + "')";
        jdbc.update("DELETE FROM votes WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM application_scores WHERE application_id IN (SELECT id FROM applications WHERE audition_id IN " + a + ")");
        jdbc.update("DELETE FROM audition_vote_candidates WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM applications WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM audition_rounds WHERE audition_id IN " + a);
        jdbc.update("DELETE FROM auditions WHERE title = '" + TITLE + "'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@per.round.vote.test'");
    }

    @Test
    void oneVotePerRoundNewVoteInNextRoundAndCancelOnlyCurrentRound() {
        UUID owner = user(), voter = user();
        UUID audition = multiAudition(owner, 1, "{1,2}", 2);
        UUID a1 = application(audition, user());
        UUID a2 = application(audition, user());
        UUID out = application(audition, user());
        jdbc.update("UPDATE applications SET final_status = 'ELIMINATED' WHERE id = ?", out);

        asRole(voter, "ROLE_USER");
        assertEquals("NOT_STARTED", votes.getPublicVotes(audition, null).getVoteStatus());
        assertFalse(votes.getPublicVotes(audition, null).isVotingEnabled());
        assertTrue(votes.getPublicVotes(audition, null).getItems().isEmpty());
        startOpen(owner, audition);
        asRole(voter, "ROLE_USER");
        assertEquals(2, votes.getPublicVotes(audition, null).getItems().size(), "탈락 지원은 후보가 아니다");
        assertThrows(ResponseStatusException.class, () -> votes.castVote(audition, out));
        votes.castVote(audition, a1);
        assertTrue(votes.castVote(audition, a2).isReplaced(), "같은 회차는 1표: 다른 지원으로 옮긴다");
        assertEquals(1, rows(voter));

        // 2차로 진행: 같은 사용자가 새 회차에 다시 투표할 수 있다.
        jdbc.update("UPDATE auditions SET current_round_number = 2 WHERE id = ?", audition);
        jdbc.update("UPDATE applications SET current_round_number = 2 WHERE id IN (?, ?)", a1, a2);
        startOpen(owner, audition, a1, a2);
        asRole(voter, "ROLE_USER");
        var page = votes.getPublicVotes(audition, null);
        assertNull(page.getMyVoteApplicationId());
        assertEquals(0L, page.getSummary().getTotalVotes());
        assertFalse(votes.castVote(audition, a1).isReplaced());
        assertEquals(2, rows(voter));
        assertEquals(List.of(1, 2), jdbc.queryForList(
                "SELECT round_number FROM votes WHERE user_id = ? ORDER BY round_number", Integer.class, voter));

        // 회차 단위 유일 제약
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update(
                "INSERT INTO votes (id, user_id, application_id, audition_id, round_number) VALUES (?, ?, ?, ?, 2)",
                UUID.randomUUID(), voter, a2, audition));

        // 공개 랭킹은 현재 회차 득표 기준
        SecurityContextHolder.clearContext();
        var board = ranking.getRanking(audition);
        assertTrue(board.isVotingEnabled());
        assertEquals(2, board.getRoundNumber());
        assertEquals(a1.toString(), board.getItems().get(0).getApplicationId());
        assertEquals(1L, board.getItems().get(0).getVoteCount());
        assertEquals(1, board.getItems().get(0).getRank());
        assertEquals(0L, board.getItems().get(1).getVoteCount());

        // 취소는 현재 회차 표만. 1차 표(a2)는 남는다.
        asRole(voter, "ROLE_USER");
        ResponseStatusException pastRound = assertThrows(ResponseStatusException.class, () -> votes.removeVote(a2));
        assertEquals(404, pastRound.getStatusCode().value());
        votes.removeVote(a1);
        assertEquals(1, rows(voter));
        assertEquals(1, jdbc.queryForObject("SELECT round_number FROM votes WHERE user_id = ?", Integer.class, voter));
    }

    @Test
    void publicRankingShowsOnlyPublicFieldsAndOwnerGetsManageView() {
        UUID owner = user(), voter = user();
        UUID audition = multiAudition(owner, 1, "{1}", 1);
        UUID app = application(audition, user());
        startOpen(owner, audition, app);
        asRole(voter, "ROLE_USER");
        votes.castVote(audition, app);

        SecurityContextHolder.clearContext();
        var anon = ranking.getRanking(audition);
        assertFalse(anon.isManageView());
        var item = anon.getItems().get(0);
        assertEquals(1L, item.getVoteCount());
        assertNull(item.getStatus());
        assertNull(item.getScore());
        assertNull(item.getCategory());
        assertNull(item.getViewCount());
        assertNull(item.getRecommended());

        asRole(user(), "ROLE_APPLICANT");
        assertEquals(1, ranking.getRanking(audition).getItems().size(), "지원자도 공개 랭킹을 본다");
        asRole(user(), "ROLE_AGENCY");
        assertFalse(ranking.getRanking(audition).isManageView(), "다른 기획사는 공개 필드만");

        asRole(owner, "ROLE_AGENCY");
        var own = ranking.getRanking(audition);
        assertTrue(own.isManageView());
        assertEquals("SUBMITTED", own.getItems().get(0).getStatus());

        // 투표 없는 회차는 비활성(공개 사용자도 오류 아님), 게시 전 공고는 공개하지 않음
        jdbc.update("UPDATE auditions SET voting_rounds = '{}' WHERE id = ?", audition);
        SecurityContextHolder.clearContext();
        assertFalse(ranking.getRanking(audition).isVotingEnabled());
        jdbc.update("UPDATE auditions SET status = 'DRAFT', voting_rounds = '{1}' WHERE id = ?", audition);
        ResponseStatusException draft = assertThrows(ResponseStatusException.class, () -> ranking.getRanking(audition));
        assertEquals(404, draft.getStatusCode().value());
    }

    @Test
    void roundApiReviewMethodAndPostingPlanAreOneSource() {
        UUID owner = user();
        // 설정 전 공고: 기본값(INTERNAL_REVIEW)으로 회차를 추가해도 투표 가능(기존 동작) 유지
        UUID legacy = multiAudition(owner, 1, null, null);
        var lr = rounds.createRound(legacy, "", "INTERNAL_REVIEW", null, null, null);
        assertNull(auditions.findById(legacy).orElseThrow().getVotingRounds());
        assertEquals("PUBLIC_VOTE", rounds.effectiveReviewMethod(lr));

        UUID audition = multiAudition(owner, 1, "{}", 1);
        var r1 = rounds.createRound(audition, "", "INTERNAL_REVIEW", null, null, null);
        var r2 = rounds.createRound(audition, "", "PUBLIC_VOTE", null, null, null);
        var a = auditions.findById(audition).orElseThrow();
        assertArrayEquals(new Integer[] {2}, a.getVotingRounds());
        assertEquals(2, a.getVotingRoundCount());
        assertEquals("INTERNAL_REVIEW", rounds.effectiveReviewMethod(r1));
        assertEquals("PUBLIC_VOTE", rounds.effectiveReviewMethod(r2));
        assertTrue(rounds.roundVotingEnabled(r2));

        // 공고 설정을 바꾸면 회차 심사 방식이 따라온다.
        jdbc.update("UPDATE auditions SET voting_rounds = '{1}' WHERE id = ?", audition);
        rounds.syncReviewMethodsFromPlan(auditions.findById(audition).orElseThrow());
        assertEquals(List.of("PUBLIC_VOTE", "INTERNAL_REVIEW"), jdbc.queryForList(
                "SELECT review_method FROM audition_rounds WHERE audition_id = ? ORDER BY round_number", String.class, audition));
    }

    @Test
    void v68MapsExistingVotesToTheRoundCurrentWhenCastAndKeepsDuplicates() throws Exception {
        UUID owner = user(), u1 = user(), u2 = user(), u3 = user(), u4 = user();
        Instant now = Instant.now();
        // 시리즈 2차 공고(단일): series_round
        UUID series = single(owner, 2);
        UUID sApp = application(series, user());
        UUID dupA = legacyVote(u1, sApp, series, now.minus(2, ChronoUnit.DAYS), null);
        UUID dupB = legacyVote(u1, sApp, series, now.minus(1, ChronoUnit.DAYS), null);
        // 다회차, 현재 1차
        UUID m1 = multiAudition(owner, 1, null, null);
        UUID m1v = legacyVote(u2, application(m1, user()), m1, now, null);
        // 다회차, 현재 3차: 투표 시각 이전 시작한 회차
        UUID m3 = multiAudition(owner, 3, null, null);
        UUID m3App = application(m3, user());
        round(m3, 1, now.minus(10, ChronoUnit.DAYS));
        round(m3, 2, now.minus(5, ChronoUnit.DAYS));
        UUID r3 = round(m3, 3, now.minus(1, ChronoUnit.DAYS));
        UUID inR2 = legacyVote(u3, m3App, m3, now.minus(3, ChronoUnit.DAYS), null);
        UUID beforeAll = legacyVote(u4, m3App, m3, now.minus(30, ChronoUnit.DAYS), null);
        UUID withRoundId = legacyVote(u2, m3App, m3, now.minus(20, ChronoUnit.DAYS), r3);

        try (Connection c = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(c, new ClassPathResource("db/migration/V68__votes_per_round.sql"));
        }

        assertEquals(2, roundOf(dupA));
        assertNull(roundOf(dupB), "중복은 지우지 않고 미배정으로 보존");
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM votes WHERE audition_id = ?", Integer.class, series));
        assertEquals(1, roundOf(m1v));
        assertEquals(2, roundOf(inR2));
        assertEquals(1, roundOf(beforeAll));
        assertEquals(3, roundOf(withRoundId));
        Integer legacyIdx = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE indexname IN ('uq_votes_user_audition_legacy', 'uq_votes_user_round')", Integer.class);
        assertEquals(0, legacyIdx);
    }

    // ---- fixtures ----

    private Integer roundOf(UUID voteId) {
        return jdbc.queryForObject("SELECT round_number FROM votes WHERE id = ?", Integer.class, voteId);
    }

    private int rows(UUID voter) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM votes WHERE user_id = ?", Integer.class, voter);
    }

    private UUID legacyVote(UUID user, UUID app, UUID audition, Instant at, UUID roundId) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO votes (id, user_id, application_id, audition_id, round_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                id, user, app, audition, roundId, Timestamp.from(at));
        return id;
    }

    private UUID round(UUID audition, int n, Instant startAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO audition_rounds (id, audition_id, round_number, review_method, start_at) VALUES (?, ?, ?, 'INTERNAL_REVIEW', ?)",
                id, audition, n, Timestamp.from(startAt));
        return id;
    }

    private void startOpen(UUID owner, UUID auditionId, UUID... apps) {
        asRole(owner, "ROLE_AGENCY");
        StartVoteRequest req = new StartVoteRequest();
        Instant now = Instant.now();
        req.setStartAt(now.minusSeconds(30).toString());
        req.setEndAt(now.plus(2, ChronoUnit.HOURS).toString());
        if (apps != null && apps.length > 0) {
            req.setApplicationIds(java.util.Arrays.stream(apps).map(UUID::toString).toList());
        }
        schedule.start(auditionId, req);
    }

    private static void asRole(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority(role))));
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "p" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'USER', ?, ?, ?, 'KR')
                """, id, handle + "@per.round.vote.test", handle, handle, handle);
        return id;
    }

    private UUID multiAudition(UUID owner, int current, String plan, Integer count) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id,
                                       process_mode, current_round_number, max_round_number, voting_rounds, voting_round_count)
                VALUES (?, ?, ?, 'desc', 'OPEN', 'KR', ?, 'MULTI_ROUND', ?, ?, ?::int[], ?)
                """, id, owner, TITLE, id, current, current, plan, count);
        return id;
    }

    private UUID single(UUID owner, int seriesRound) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id, series_round)
                VALUES (?, ?, ?, 'desc', 'OPEN', 'KR', ?, ?)
                """, id, owner, TITLE, id, seriesRound);
        return id;
    }

    private UUID application(UUID auditionId, UUID applicantId) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO applications (id, audition_id, applicant_id, status) VALUES (?, ?, ?, 'SUBMITTED')",
                id, auditionId, applicantId);
        return id;
    }
}
