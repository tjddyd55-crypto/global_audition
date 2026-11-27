package com.audition.platform.application.notifications;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.android-push.enabled", havingValue = "true")
public class AndroidPushDelivery {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final NotificationSettingsService settings;
    private final String accessToken;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();

    public AndroidPushDelivery(JdbcTemplate jdbc, ObjectMapper json, NotificationSettingsService settings,
                               @Value("${app.android-push.access-token:}") String accessToken) {
        this.jdbc = jdbc;
        this.json = json;
        this.settings = settings;
        this.accessToken = accessToken;
    }

    @Scheduled(fixedDelayString = "${app.android-push.poll-ms:60000}")
    public void process() {
        enqueue();
        for (int i = 0; i < 20; i++) {
            List<Delivery> rows = claim();
            if (rows.isEmpty()) return;
            deliver(rows.get(0));
        }
    }

    private void enqueue() {
        jdbc.update("""
                WITH events AS (
                    SELECT id, user_id, notification_type AS kind, link, created_at
                      FROM user_notifications
                     WHERE created_at > NOW() - INTERVAL '1 day'
                       AND notification_type IN ('APPLICATION_RESULT','CASTING_OFFER_NEW','SAVED_AUDITION_DEADLINE','NEW_MATCHING_AUDITION')
                    UNION ALL
                    SELECT n.id, a.applicant_id, n.notification_type, '/applications/' || a.id, n.created_at
                      FROM audition_round_notifications n JOIN applications a ON a.id = n.application_id
                     WHERE n.channel='IN_APP' AND n.notification_type IN ('PASS_NOTICE','FAIL_NOTICE','FINAL_NOTICE')
                       AND n.created_at > NOW() - INTERVAL '1 day'
                    UNION ALL
                    SELECT n.id, a.applicant_id, n.notification_type, '/applications/' || a.id, n.created_at
                      FROM audition_round_notifications n JOIN applications a ON a.audition_id=n.audition_id
                     WHERE n.channel='IN_APP' AND n.notification_type='ROUND_OPEN' AND n.application_id IS NULL
                       AND n.created_at > NOW() - INTERVAL '1 day'
                )
                INSERT INTO android_push_deliveries (installation_id,user_id,notification_id,kind,link,expires_at)
                SELECT p.id, e.user_id, e.id, e.kind, e.link, e.created_at + INTERVAL '1 day'
                  FROM events e
                  JOIN android_push_installations p ON p.user_id=e.user_id AND p.active AND p.registered_at<=e.created_at
                  JOIN users u ON u.id=p.user_id AND u.account_status='ACTIVE'
                 WHERE e.link LIKE '/%' AND p.refreshed_at > NOW() - INTERVAL '30 days'
                   AND NOT EXISTS (SELECT 1 FROM android_push_deliveries d WHERE d.installation_id=p.id AND d.notification_id=e.id)
                 ORDER BY e.created_at
                 LIMIT 200
                ON CONFLICT DO NOTHING
                """);
    }

    private List<Delivery> claim() {
        return jdbc.query("""
                WITH head AS (
                    SELECT d.installation_id,d.notification_id,p.expo_token,p.locale
                      FROM android_push_deliveries d
                      JOIN android_push_installations p ON p.id=d.installation_id AND p.user_id=d.user_id AND p.active
                      JOIN users u ON u.id=d.user_id AND u.account_status='ACTIVE'
                     WHERE d.status IN ('PENDING','RECEIPT') AND d.next_attempt<=NOW() AND d.expires_at>NOW()
                       AND p.refreshed_at > NOW()-INTERVAL '30 days'
                     ORDER BY d.next_attempt LIMIT 1 FOR UPDATE OF d SKIP LOCKED
                )
                UPDATE android_push_deliveries d
                   SET next_attempt=NOW()+INTERVAL '2 minutes', attempts=attempts+1
                  FROM head h
                 WHERE d.installation_id=h.installation_id AND d.notification_id=h.notification_id
                RETURNING d.*,h.expo_token,h.locale
                """, (rs, row) -> new Delivery(
                rs.getObject("installation_id", UUID.class), rs.getObject("user_id", UUID.class),
                rs.getObject("notification_id", UUID.class), rs.getString("kind"), rs.getString("link"),
                rs.getString("expo_token"), rs.getString("locale"), rs.getString("expo_ticket"), rs.getInt("attempts")));
    }

    private void deliver(Delivery row) {
        if (row.attempts > 4 || !settings.get(row.userId).allows(row.kind)) {
            finish(row, "FAILED", "LIMIT_OR_DISABLED");
            return;
        }
        try {
            if (row.ticket != null) {
                JsonNode receipt = call("/getReceipts", Map.of("ids", List.of(row.ticket))).path("data").path(row.ticket);
                if (receipt.isMissingNode()) return;
                handleResult(row, receipt, false);
                return;
            }
            JsonNode ticket = call("/send", Map.of(
                    "to", row.token, "title", "GLOBAL AUDITION", "body", genericBody(row.locale),
                    "ttl", 3600, "channelId", "activity",
                    "data", Map.of("notificationId", row.notificationId.toString(), "recipient", row.userId.toString(), "link", row.link)))
                    .path("data");
            handleResult(row, ticket, true);
        } catch (IOException | RuntimeException ignored) {
            // Transient strictly bounded retries; never print Expo tokens or payloads to logs.
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }

    private void handleResult(Delivery row, JsonNode result, boolean initial) {
        if ("ok".equals(result.path("status").asText())) {
            if (!initial) {
                finish(row, "DELIVERED", null);
            } else if (result.hasNonNull("id")) {
                jdbc.update("""
                        UPDATE android_push_deliveries SET status='RECEIPT',expo_ticket=?,next_attempt=NOW()+INTERVAL '15 minutes',attempts=0
                         WHERE installation_id=? AND notification_id=?
                        """, result.path("id").asText(), row.installationId, row.notificationId);
            }
            return;
        }
        String error = result.path("details").path("error").asText("EXPO_ERROR");
        if ("MessageRateExceeded".equals(error)) return;
        if ("DeviceNotRegistered".equals(error)) {
            jdbc.update("UPDATE android_push_installations SET active=FALSE WHERE id=? AND user_id=? AND expo_token=?",
                    row.installationId, row.userId, row.token);
        }
        finish(row, "FAILED", "DeviceNotRegistered".equals(error) ? error : "EXPO_REJECTED");
    }

    private JsonNode call(String path, Map<String, ?> object) throws IOException, InterruptedException {
        var builder = HttpRequest.newBuilder(URI.create("https://exp.host/--/api/v2/push" + path))
                .timeout(Duration.ofSeconds(7)).header("Content-Type", "application/json").header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(object)));
        if (!accessToken.isBlank()) builder.header("Authorization", "Bearer " + accessToken);
        var response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) throw new IOException("Expo endpoint unavailable");
        return json.readTree(response.body());
    }

    private void finish(Delivery row, String status, String code) {
        jdbc.update("UPDATE android_push_deliveries SET status=?,error_code=? WHERE installation_id=? AND notification_id=?",
                status, code, row.installationId, row.notificationId);
    }

    private static String genericBody(String locale) {
        return switch (locale) {
            case "ko" -> "새 알림이 도착했습니다.";
            case "mn" -> "Шинэ мэдэгдэл ирлээ.";
            case "km" -> "មានការជូនដំណឹងថ្មី។";
            case "uz" -> "Yangi bildirishnoma keldi.";
            case "zh-CN" -> "您有一条新通知。";
            case "zh-TW" -> "您有一則新通知。";
            default -> "You have a new notification.";
        };
    }

    private record Delivery(UUID installationId, UUID userId, UUID notificationId, String kind, String link,
                            String token, String locale, String ticket, int attempts) {}
}
