package com.audition.platform.application.round;

import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestDatabase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 다단계 합격/불합격은 저장·알림 이후 응답 직렬화까지 2xx 이고, 재시도는 상태와 알림을 늘리지 않는다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RoundReviewResponseIT {

    private static final String TITLE = "round-review-response";

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        TestDatabase.register(registry);
        byte[] key = new byte[64];
        new SecureRandom().nextBytes(key);
        registry.add("app.jwt.secret", () -> Base64.getUrlEncoder().withoutPadding().encodeToString(key));
        registry.add("app.super-admin.bootstrap-enabled", () -> "false");
        registry.add("app.translation.queue.enabled", () -> "false");
        registry.add("audition.voting-db-verify", () -> "false");
    }

    @Autowired
    private MockMvc mvc;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ObjectMapper json;
    @Autowired
    private JwtService jwt;

    @AfterEach
    void cleanup() {
        jdbc.update("""
                UPDATE applications SET latest_round_submission_id = NULL
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("""
                DELETE FROM audition_round_notifications
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("""
                DELETE FROM audition_round_result_logs
                WHERE application_id IN (
                    SELECT id FROM applications
                    WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                )
                """, TITLE);
        jdbc.update("""
                DELETE FROM application_status_history
                WHERE application_id IN (
                    SELECT id FROM applications
                    WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                )
                """, TITLE);
        jdbc.update("""
                DELETE FROM application_scores
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("""
                DELETE FROM application_round_submissions
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("""
                DELETE FROM applications
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("""
                DELETE FROM audition_rounds
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = ?)
                """, TITLE);
        jdbc.update("DELETE FROM auditions WHERE title = ?", TITLE);
        jdbc.update("DELETE FROM users WHERE email LIKE '%@round.review.test'");
    }

    @Test
    void firstRoundPassAdvancesAndAgreesWithDatabase() throws Exception {
        Fixture fixture = multiRound(2);
        MvcResult result = review(fixture.token, fixture.applicationId, fixture.rounds.get(0), "pass", "{}")
                .andExpect(status().isOk())
                .andReturn();

        assertMatchesDatabase(result, fixture.applicationId, fixture.rounds.get(0));
        assertEquals("PASSED", statusOf(fixture.applicationId, fixture.rounds.get(0)));
        assertEquals("NOT_SUBMITTED", statusOf(fixture.applicationId, fixture.rounds.get(1)));
        assertEquals(2, currentRound(fixture.applicationId));
        assertEquals("IN_PROGRESS", finalStatus(fixture.applicationId));
        assertEquals("SUBMITTED", applicationStatus(fixture.applicationId));
        assertEquals(1L, notices(fixture.applicationId, "PASS_NOTICE"));
        assertEquals(0L, notices(fixture.applicationId, "FAIL_NOTICE"));
    }

    @Test
    void firstRoundFailEliminatesAndAgreesWithDatabase() throws Exception {
        Fixture fixture = multiRound(2);
        MvcResult result = review(fixture.token, fixture.applicationId, fixture.rounds.get(0), "fail",
                "{\"reason\":\"pitch\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissionStatus").value("FAILED"))
                .andExpect(jsonPath("$.reviewerNote").value("pitch"))
                .andExpect(jsonPath("$.applicationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.finalStatus").value("ELIMINATED"))
                .andReturn();

        assertMatchesDatabase(result, fixture.applicationId, fixture.rounds.get(0));
        assertEquals(1, currentRound(fixture.applicationId));
        assertEquals("FAILED", latestResult(fixture.applicationId));
        assertEquals(1L, notices(fixture.applicationId, "FAIL_NOTICE"));
        assertEquals("pitch", jdbc.queryForObject(
                "SELECT reviewer_note FROM application_round_submissions WHERE application_id = ? AND round_id = ?",
                String.class, fixture.applicationId, fixture.rounds.get(0)));
    }

    @Test
    void secondRoundAdvanceStaysInProgress() throws Exception {
        Fixture fixture = multiRound(3);
        review(fixture.token, fixture.applicationId, fixture.rounds.get(0), "pass", "{}")
                .andExpect(status().isOk());
        MvcResult second = review(fixture.token, fixture.applicationId, fixture.rounds.get(1), "pass", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roundNumber").value(2))
                .andExpect(jsonPath("$.submissionStatus").value("PASSED"))
                .andExpect(jsonPath("$.currentRoundNumber").value(3))
                .andExpect(jsonPath("$.finalStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.applicationStatus").value("SUBMITTED"))
                .andReturn();

        assertMatchesDatabase(second, fixture.applicationId, fixture.rounds.get(1));
        assertEquals("PASSED", statusOf(fixture.applicationId, fixture.rounds.get(0)));
        assertEquals("PASSED", statusOf(fixture.applicationId, fixture.rounds.get(1)));
        assertEquals("NOT_SUBMITTED", statusOf(fixture.applicationId, fixture.rounds.get(2)));
        assertEquals(2L, notices(fixture.applicationId, "PASS_NOTICE"));
    }

    @Test
    void finalPassAcceptsOnLastRound() throws Exception {
        Fixture fixture = multiRound(2);
        review(fixture.token, fixture.applicationId, fixture.rounds.get(0), "pass", "{}")
                .andExpect(status().isOk());
        MvcResult finalPass = review(fixture.token, fixture.applicationId, fixture.rounds.get(1), "pass", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissionStatus").value("PASSED"))
                .andExpect(jsonPath("$.currentRoundNumber").value(2))
                .andExpect(jsonPath("$.finalStatus").value("FINAL_PASSED"))
                .andExpect(jsonPath("$.applicationStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.latestResultStatus").value("PASSED"))
                .andReturn();

        assertMatchesDatabase(finalPass, fixture.applicationId, fixture.rounds.get(1));
        assertEquals(2L, notices(fixture.applicationId, "PASS_NOTICE"));
    }

    @Test
    void duplicateRequestDoesNotChangeStateOrNotifyAgain() throws Exception {
        Fixture passed = multiRound(2);
        review(passed.token, passed.applicationId, passed.rounds.get(0), "pass", "{}")
                .andExpect(status().isOk());
        MvcResult again = review(passed.token, passed.applicationId, passed.rounds.get(0), "pass", "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissionStatus").value("PASSED"))
                .andExpect(jsonPath("$.currentRoundNumber").value(2))
                .andReturn();
        assertMatchesDatabase(again, passed.applicationId, passed.rounds.get(0));
        assertEquals(1L, notices(passed.applicationId, "PASS_NOTICE"));
        assertEquals(1L, logs(passed.applicationId, passed.rounds.get(0)));
        assertEquals(2, currentRound(passed.applicationId));

        review(passed.token, passed.applicationId, passed.rounds.get(0), "fail", "{\"reason\":\"late\"}")
                .andExpect(status().isConflict());
        assertEquals(0L, notices(passed.applicationId, "FAIL_NOTICE"));
        assertEquals("PASSED", statusOf(passed.applicationId, passed.rounds.get(0)));
        assertEquals(1L, logs(passed.applicationId, passed.rounds.get(0)));

        Fixture failed = multiRound(2);
        review(failed.token, failed.applicationId, failed.rounds.get(0), "fail", "{\"reason\":\"once\"}")
                .andExpect(status().isOk());
        review(failed.token, failed.applicationId, failed.rounds.get(0), "fail", "{\"reason\":\"twice\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewerNote").value("once"));
        assertEquals(1L, notices(failed.applicationId, "FAIL_NOTICE"));
        assertEquals(1L, logs(failed.applicationId, failed.rounds.get(0)));
        assertEquals("REJECTED", applicationStatus(failed.applicationId));
    }

    @Test
    void otherAgencyIsForbiddenAndDoesNotWrite() throws Exception {
        Fixture fixture = multiRound(2);
        UUID other = user("other", "AGENCY");
        review(token(other), fixture.applicationId, fixture.rounds.get(0), "pass", "{}")
                .andExpect(status().isForbidden());
        assertEquals("SUBMITTED", statusOf(fixture.applicationId, fixture.rounds.get(0)));
        assertEquals(1, currentRound(fixture.applicationId));
        assertEquals(0L, notices(fixture.applicationId, "PASS_NOTICE"));
        assertEquals(0L, logs(fixture.applicationId, fixture.rounds.get(0)));
    }

    @Test
    void missingNextRoundRollsBackInsteadOfReturningSuccess() throws Exception {
        Fixture fixture = multiRound(1);
        UUID auditionId = jdbc.queryForObject(
                "SELECT audition_id FROM applications WHERE id = ?", UUID.class, fixture.applicationId);
        round(auditionId, 3);
        review(fixture.token, fixture.applicationId, fixture.rounds.get(0), "pass", "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("NEXT_ROUND_NOT_CREATED"));
        assertEquals("SUBMITTED", statusOf(fixture.applicationId, fixture.rounds.get(0)));
        assertEquals("SUBMITTED", applicationStatus(fixture.applicationId));
        assertEquals(1, currentRound(fixture.applicationId));
        assertEquals("IN_PROGRESS", finalStatus(fixture.applicationId));
        assertEquals(0L, notices(fixture.applicationId, "PASS_NOTICE"));
        assertEquals(0L, logs(fixture.applicationId, fixture.rounds.get(0)));
    }

    @Test
    void singleStageReviewStaysOnTheStatusPatch() throws Exception {
        UUID agency = user("agency", "AGENCY");
        UUID applicant = user("applicant", "APPLICANT");
        UUID auditionId = audition(agency, "SINGLE");
        UUID applicationId = application(auditionId, applicant);
        String token = token(agency);

        mvc.perform(post("/api/admin/applications/" + applicationId + "/rounds/" + UUID.randomUUID() + "/pass")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("NOT_MULTI_ROUND"));
        assertEquals("SUBMITTED", applicationStatus(applicationId));
        assertEquals(0L, notices(applicationId, "PASS_NOTICE"));

        mvc.perform(patch("/api/applications/" + applicationId + "/status")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
        assertEquals("ACCEPTED", applicationStatus(applicationId));
        assertEquals(1L, notices(applicationId, "PASS_NOTICE"));
        assertNull(jdbc.queryForObject("""
                SELECT round_id FROM audition_round_notifications
                WHERE application_id = ? AND notification_type = 'PASS_NOTICE'
                """, UUID.class, applicationId));

        mvc.perform(patch("/api/applications/" + applicationId + "/status")
                        .header("Authorization", token)
                        .contentType(APPLICATION_JSON)
                        .content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
        assertEquals("ACCEPTED", applicationStatus(applicationId));
        assertEquals(1L, notices(applicationId, "PASS_NOTICE"));
    }

    private ResultActions review(String token, UUID applicationId, UUID roundId, String action, String body)
            throws Exception {
        return mvc.perform(post("/api/admin/applications/" + applicationId + "/rounds/" + roundId + "/" + action)
                .header("Authorization", token)
                .contentType(APPLICATION_JSON)
                .content(body));
    }

    private void assertMatchesDatabase(MvcResult result, UUID applicationId, UUID roundId) throws Exception {
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        assertEquals(statusOf(applicationId, roundId), body.get("submissionStatus").asText());
        assertEquals(applicationStatus(applicationId), body.get("applicationStatus").asText());
        assertEquals(currentRound(applicationId), body.get("currentRoundNumber").asInt());
        assertEquals(finalStatus(applicationId), body.get("finalStatus").asText());
        assertEquals(latestResult(applicationId), body.get("latestResultStatus").asText());
        assertEquals(applicationId.toString(), body.get("applicationId").asText());
        assertEquals(roundId.toString(), body.get("roundId").asText());
        assertEquals(200, result.getResponse().getStatus());
    }

    private Fixture multiRound(int rounds) {
        UUID agency = user("agency", "AGENCY");
        UUID applicant = user("applicant", "APPLICANT");
        UUID auditionId = audition(agency, "MULTI_ROUND");
        List<UUID> roundIds = new ArrayList<>();
        for (int number = 1; number <= rounds; number++) {
            roundIds.add(round(auditionId, number));
        }
        UUID applicationId = application(auditionId, applicant);
        submission(applicationId, auditionId, roundIds.get(0), 1);
        return new Fixture(token(agency), applicationId, roundIds);
    }

    private UUID user(String label, String role) {
        UUID id = UUID.randomUUID();
        String handle = label + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, 'MN')
                """, id, handle + "@round.review.test", role, handle, handle, handle);
        return id;
    }

    private String token(UUID userId) {
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, userId);
        String role = jdbc.queryForObject("SELECT role FROM users WHERE id = ?", String.class, userId);
        return "Bearer " + jwt.createToken(userId, email, role);
    }

    private UUID audition(UUID ownerId, String processMode) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id, process_mode)
                VALUES (?, ?, ?, 'desc', 'OPEN', 'MN', ?, ?)
                """, id, ownerId, TITLE, id, processMode);
        return id;
    }

    private UUID round(UUID auditionId, int number) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO audition_rounds (id, audition_id, round_number, review_method)
                VALUES (?, ?, ?, 'INTERNAL_REVIEW')
                """, id, auditionId, number);
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

    private void submission(UUID applicationId, UUID auditionId, UUID roundId, int number) {
        jdbc.update("""
                INSERT INTO application_round_submissions
                    (id, application_id, audition_id, round_id, round_number, submission_status)
                VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
                """, UUID.randomUUID(), applicationId, auditionId, roundId, number);
    }

    private String statusOf(UUID applicationId, UUID roundId) {
        return jdbc.queryForObject("""
                SELECT submission_status FROM application_round_submissions
                WHERE application_id = ? AND round_id = ?
                """, String.class, applicationId, roundId);
    }

    private String applicationStatus(UUID applicationId) {
        return jdbc.queryForObject("SELECT status FROM applications WHERE id = ?", String.class, applicationId);
    }

    private int currentRound(UUID applicationId) {
        Integer value = jdbc.queryForObject(
                "SELECT current_round_number FROM applications WHERE id = ?", Integer.class, applicationId);
        return value == null ? -1 : value;
    }

    private String finalStatus(UUID applicationId) {
        return jdbc.queryForObject("SELECT final_status FROM applications WHERE id = ?", String.class, applicationId);
    }

    private String latestResult(UUID applicationId) {
        return jdbc.queryForObject(
                "SELECT latest_result_status FROM applications WHERE id = ?", String.class, applicationId);
    }

    private long notices(UUID applicationId, String type) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM audition_round_notifications
                WHERE application_id = ? AND notification_type = ?
                """, Long.class, applicationId, type);
        return count == null ? 0 : count;
    }

    private long logs(UUID applicationId, UUID roundId) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM audition_round_result_logs
                WHERE application_id = ? AND round_id = ?
                """, Long.class, applicationId, roundId);
        return count == null ? 0 : count;
    }

    private record Fixture(String token, UUID applicationId, List<UUID> rounds) {
    }
}
