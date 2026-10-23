package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeNotificationItemResponse;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
})
class MeNotificationMarkReadIT {

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private MeNotificationService notifications;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM audition_round_notifications WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'studio-notice')");
        jdbc.update("DELETE FROM applications WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'studio-notice')");
        jdbc.update("DELETE FROM audition_rounds WHERE audition_id IN (SELECT id FROM auditions WHERE title = 'studio-notice')");
        jdbc.update("DELETE FROM auditions WHERE title = 'studio-notice'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@studio.notice.test'");
    }

    @Test
    void markReadSetsReadAtWithoutChangingDeliveryStatusAndHidesOtherInboxes() {
        UUID applicant = user("applicant");
        UUID stranger = user("stranger");
        UUID owner = user("owner");
        UUID audition = audition(owner);
        UUID round = round(audition);
        UUID application = application(audition, applicant);
        UUID mine = notice(audition, round, application, "IN_APP", "SENT", applicantEmail(applicant), "{\"title\":\"Result\",\"body\":\"Passed the round\"}");
        UUID emailOnly = notice(audition, round, application, "EMAIL", "SENT", applicantEmail(applicant), "{\"title\":\"Mail\",\"body\":\"Mail body\"}");
        UUID theirs = notice(audition, round, null, "IN_APP", "PENDING", stranger + "@no.example", "{\"title\":\"Other\",\"body\":\"Other body\"}");

        asUser(applicant);
        List<MeNotificationItemResponse> inbox = notifications.listMine();
        assertEquals(List.of(mine.toString()), inbox.stream().map(MeNotificationItemResponse::getId).toList());
        assertEquals("SENT", inbox.get(0).getStatus());
        assertEquals(null, inbox.get(0).getReadAt());

        MeNotificationItemResponse read = notifications.markRead(mine);
        assertNotNull(read.getReadAt());
        assertEquals("SENT", read.getStatus());
        assertEquals("Result", read.getTitle());

        MeNotificationItemResponse again = notifications.markRead(mine);
        assertEquals(read.getReadAt(), again.getReadAt());

        ResponseStatusException missing = assertThrows(ResponseStatusException.class, () -> notifications.markRead(theirs));
        assertEquals(404, missing.getStatusCode().value());
        ResponseStatusException email = assertThrows(ResponseStatusException.class, () -> notifications.markRead(emailOnly));
        assertEquals(404, email.getStatusCode().value());

        asUser(stranger);
        assertTrue(notifications.listMine().isEmpty());
        assertThrows(ResponseStatusException.class, () -> notifications.markRead(mine));
    }

    private UUID user(String label) {
        UUID id = UUID.randomUUID();
        String handle = label + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'APPLICANT', ?, ?, ?, 'PH')
                """, id, handle + "@studio.notice.test", handle, handle, handle);
        return id;
    }

    private String applicantEmail(UUID id) {
        return jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, id);
    }

    private UUID audition(UUID owner) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, group_id)
                VALUES (?, ?, 'studio-notice', 'desc', 'OPEN', 'PH', ?)
                """, id, owner, id);
        return id;
    }

    private UUID round(UUID auditionId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO audition_rounds (id, audition_id, round_number, review_method)
                VALUES (?, ?, 1, 'INTERNAL_REVIEW')
                """, id, auditionId);
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

    private UUID notice(UUID auditionId, UUID roundId, UUID applicationId, String channel, String status, String email, String payload) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO audition_round_notifications
                    (id, audition_id, round_id, application_id, notification_type, channel, target_email, status, payload_json)
                VALUES (?, ?, ?, ?, 'PASS_NOTICE', ?, ?, ?, ?::jsonb)
                """, id, auditionId, roundId, applicationId, channel, email, status, payload);
        return id;
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));
    }
}
