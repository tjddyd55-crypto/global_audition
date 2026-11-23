package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeNotificationItemResponse;
import com.audition.platform.application.casting.UserNotificationService;
import com.audition.platform.application.notifications.NotificationSettings;
import com.audition.platform.application.notifications.NotificationSettingsService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 지원자 수신함. audition_round_notifications 에 이미 기록된 IN_APP 행만 읽는다.
 * 빈 목록은 알림이 없는 상태이며, 종류 설명 카드를 성공처럼 만들지 않는다.
 */
@Service
public class MeNotificationService {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final UserNotificationService userNotifications;
    private final ObjectMapper objectMapper;
    private final NotificationSettingsService settings;

    public MeNotificationService(JdbcTemplate jdbcTemplate, UserRepository userRepository,
                                 UserNotificationService userNotifications, ObjectMapper objectMapper,
                                 NotificationSettingsService settings) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.userNotifications = userNotifications;
        this.objectMapper = objectMapper;
        this.settings = settings;
    }

    public List<MeNotificationItemResponse> listMine() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        String email = user.getEmail() != null ? user.getEmail() : "";
        List<MeNotificationItemResponse> rounds = jdbcTemplate.query(
                """
                SELECT n.id::text AS id,
                       n.audition_id::text AS audition_id,
                       n.application_id::text AS application_id,
                       n.notification_type,
                       n.status,
                       n.channel,
                       n.created_at,
                       n.read_at,
                       n.round_id::text AS round_id,
                       n.payload_json::text AS payload
                FROM audition_round_notifications n
                LEFT JOIN applications a ON a.id = n.application_id
                WHERE n.channel = 'IN_APP'
                  AND (
                    a.applicant_id = ?
                    OR (n.target_email IS NOT NULL AND lower(n.target_email) = lower(?))
                    OR (
                      n.application_id IS NULL
                      AND n.notification_type = 'ROUND_OPEN'
                      AND EXISTS (
                        SELECT 1 FROM applications ax
                        WHERE ax.applicant_id = ? AND ax.audition_id = n.audition_id
                      )
                    )
                  )
                ORDER BY n.created_at DESC
                LIMIT 100
                """,
                (rs, rowNum) -> mapRow(rs),
                userId, email, userId);
        List<MeNotificationItemResponse> merged = new ArrayList<>(rounds);
        for (UserNotificationService.Row row : userNotifications.listFor(userId, 100)) {
            merged.add(mapUserRow(row));
        }
        NotificationSettings pref = settings.get(userId);
        merged.removeIf(item -> !pref.allows(item.getType()));
        merged.sort(Comparator.comparing(MeNotificationItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.<Instant>naturalOrder())).reversed());
        return merged.size() > 100 ? new ArrayList<>(merged.subList(0, 100)) : merged;
    }

    /** 캐스팅·구독 알림. 문구는 카탈로그 키 + params. */
    private MeNotificationItemResponse mapUserRow(UserNotificationService.Row row) {
        MeNotificationItemResponse item = new MeNotificationItemResponse();
        item.setId(row.id().toString());
        item.setType(row.type());
        item.setStatus("SENT");
        item.setChannel("IN_APP");
        item.setCreatedAt(row.createdAt());
        item.setReadAt(row.readAt());
        item.setLink(row.link());
        try {
            JsonNode node = objectMapper.readTree(row.payload() == null ? "{}" : row.payload());
            item.setTitleKey(node.path("titleKey").asText(null));
            item.setBodyKey(node.path("bodyKey").asText(null));
            JsonNode params = node.path("params");
            if (params.isObject()) {
                item.setParams(objectMapper.convertValue(params, new TypeReference<Map<String, String>>() { }));
                String auditionId = item.getParams() == null ? null : item.getParams().get("auditionId");
                if (auditionId != null && !auditionId.isBlank()) {
                    item.setAuditionId(auditionId);
                }
            }
        } catch (Exception ignored) {
            // 손상된 payload 는 타입 코드만 보인다.
        }
        return item;
    }

    public MeNotificationItemResponse markRead(UUID notificationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        String email = user.getEmail() != null ? user.getEmail() : "";
        if (userNotifications.markRead(userId, notificationId)) {
            return listMine().stream()
                    .filter(item -> notificationId.toString().equals(item.getId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."));
        }
        int updated = jdbcTemplate.update(
                """
                UPDATE audition_round_notifications n
                SET read_at = COALESCE(n.read_at, NOW())
                WHERE n.id = ?
                  AND n.channel = 'IN_APP'
                  AND (
                    EXISTS (
                      SELECT 1 FROM applications a
                      WHERE a.id = n.application_id AND a.applicant_id = ?
                    )
                    OR (n.target_email IS NOT NULL AND lower(n.target_email) = lower(?))
                    OR (
                      n.application_id IS NULL
                      AND n.notification_type = 'ROUND_OPEN'
                      AND EXISTS (
                        SELECT 1 FROM applications ax
                        WHERE ax.applicant_id = ? AND ax.audition_id = n.audition_id
                      )
                    )
                  )
                """,
                notificationId, userId, email, userId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다.");
        }
        return listMine().stream()
                .filter(item -> notificationId.toString().equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다."));
    }

    private static MeNotificationItemResponse mapRow(ResultSet rs) throws SQLException {
        MeNotificationItemResponse item = new MeNotificationItemResponse();
        item.setId(rs.getString("id"));
        item.setAuditionId(rs.getString("audition_id"));
        item.setApplicationId(rs.getString("application_id"));
        item.setType(rs.getString("notification_type"));
        item.setStatus(rs.getString("status"));
        item.setChannel(rs.getString("channel"));
        Timestamp created = rs.getTimestamp("created_at");
        item.setCreatedAt(created != null ? created.toInstant() : null);
        Timestamp readAt = rs.getTimestamp("read_at");
        item.setReadAt(readAt != null ? readAt.toInstant() : null);
        String payload = rs.getString("payload");
        item.setTitle(NotificationPayloadText.text(payload, "title"));
        item.setBody(NotificationPayloadText.text(payload, "body"));
        item.setTitleKey(NotificationPayloadText.text(payload, "titleKey"));
        item.setBodyKey(NotificationPayloadText.text(payload, "bodyKey"));
        item.setRoundId(rs.getString("round_id"));
        String auditionId = item.getAuditionId();
        if (auditionId != null && !auditionId.isBlank()) {
            item.setLink("/auditions/" + auditionId);
        }
        return item;
    }
}
