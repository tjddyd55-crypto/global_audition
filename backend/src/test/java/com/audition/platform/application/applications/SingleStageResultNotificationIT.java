package com.audition.platform.application.applications;

import com.audition.platform.api.dto.me.MeNotificationItemResponse;
import com.audition.platform.application.me.MeNotificationService;
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

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
class SingleStageResultNotificationIT {

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ApplicationStatusService statusService;
    @Autowired
    private MeNotificationService notifications;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("""
                DELETE FROM audition_round_notifications
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'single-stage-notice')
                """);
        jdbc.update("""
                DELETE FROM application_status_history
                WHERE application_id IN (
                    SELECT id FROM applications
                    WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'single-stage-notice')
                )
                """);
        jdbc.update("""
                DELETE FROM application_scores
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'single-stage-notice')
                """);
        jdbc.update("""
                DELETE FROM applications
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'single-stage-notice')
                """);
        jdbc.update("""
                DELETE FROM audition_rounds
                WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'single-stage-notice')
                """);
        jdbc.update("DELETE FROM auditions WHERE title = 'single-stage-notice'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@single.stage.test'");
    }

    @Test
    void acceptAndRejectCreateOneNoticePerResultForTheApplicantOnly() {
        UUID agency = user("agency", "AGENCY");
        UUID applicant = user("applicant", "APPLICANT");
        UUID stranger = user("stranger", "APPLICANT");
        UUID auditionId = audition(agency, "SINGLE");
        UUID applicationId = application(auditionId, applicant);

        asUser(agency, "AGENCY");
        statusService.patchApplicationStatus(applicationId, "REVIEWING");
        assertEquals(0L, noticeCount(applicationId));

        statusService.patchApplicationStatus(applicationId, "APPROVED");
        statusService.patchApplicationStatus(applicationId, "ACCEPTED");
        assertEquals(1L, noticeCount(applicationId));
        assertEquals("PASS_NOTICE", noticeType(applicationId, "PASS_NOTICE"));
        assertNull(roundId(applicationId, "PASS_NOTICE"));
        assertTrue(payload(applicationId, "PASS_NOTICE").contains("singleStagePassTitle"));
        assertTrue(payload(applicationId, "PASS_NOTICE").contains("singleStagePassBody"));

        statusService.patchApplicationStatus(applicationId, "REJECTED");
        statusService.patchApplicationStatus(applicationId, "REJECTED");
        assertEquals(2L, noticeCount(applicationId));
        assertTrue(payload(applicationId, "FAIL_NOTICE").contains("singleStageFailTitle"));

        asUser(applicant, "APPLICANT");
        List<MeNotificationItemResponse> inbox = notifications.listMine();
        assertEquals(2, inbox.size());
        assertTrue(inbox.stream().allMatch(item -> applicationId.toString().equals(item.getApplicationId())));
        assertTrue(inbox.stream().anyMatch(item -> "singleStagePassTitle".equals(item.getTitleKey())));
        assertTrue(inbox.stream().anyMatch(item -> "singleStageFailBody".equals(item.getBodyKey())));

        UUID noticeId = UUID.fromString(inbox.get(0).getId());
        asUser(stranger, "APPLICANT");
        assertTrue(notifications.listMine().isEmpty());
        ResponseStatusException hidden = assertThrows(ResponseStatusException.class, () -> notifications.markRead(noticeId));
        assertEquals(404, hidden.getStatusCode().value());
    }

    @Test
    void multiRoundStatusPatchDoesNotCreateASingleStageNotice() {
        UUID agency = user("agency", "AGENCY");
        UUID applicant = user("applicant", "APPLICANT");
        UUID auditionId = audition(agency, "MULTI_ROUND");
        UUID applicationId = application(auditionId, applicant);

        asUser(agency, "AGENCY");
        statusService.patchApplicationStatus(applicationId, "APPROVED");
        statusService.patchApplicationStatus(applicationId, "REJECTED");

        assertEquals(0L, noticeCount(applicationId));
    }

    private UUID user(String label, String role) {
        UUID id = UUID.randomUUID();
        String handle = label + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, 'MN')
                """, id, handle + "@single.stage.test", role, handle, handle, handle);
        return id;
    }

    private UUID audition(UUID ownerId, String processMode) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id, process_mode)
                VALUES (?, ?, 'single-stage-notice', 'desc', 'OPEN', 'MN', ?, ?)
                """, id, ownerId, id, processMode);
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

    private long noticeCount(UUID applicationId) {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM audition_round_notifications WHERE application_id = ?",
                Long.class,
                applicationId);
        return count == null ? 0 : count;
    }

    private String noticeType(UUID applicationId, String type) {
        return jdbc.queryForObject("""
                SELECT notification_type FROM audition_round_notifications
                WHERE application_id = ? AND notification_type = ?
                """, String.class, applicationId, type);
    }

    private UUID roundId(UUID applicationId, String type) {
        return jdbc.query("""
                SELECT round_id FROM audition_round_notifications
                WHERE application_id = ? AND notification_type = ?
                """, (rs, row) -> (UUID) rs.getObject("round_id"), applicationId, type).get(0);
    }

    private String payload(UUID applicationId, String type) {
        return jdbc.queryForObject("""
                SELECT payload_json::text FROM audition_round_notifications
                WHERE application_id = ? AND notification_type = ?
                """, String.class, applicationId, type);
    }

    private static void asUser(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
