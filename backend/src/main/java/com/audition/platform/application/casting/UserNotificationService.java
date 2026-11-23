package com.audition.platform.application.casting;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.audition.platform.application.notifications.NotificationSettingsService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 앱 내 알림(user_notifications). 오디션 회차 알림과 함께 /api/me/notifications 에 합쳐진다.
 * 문구는 클라이언트 카탈로그 키(titleKey/bodyKey)+params 로만 저장한다. 연락처·내부 메모는 넣지 않는다.
 * 푸시 모듈이 없으므로 앱 안에서만 보인다.
 */
@Service
public class UserNotificationService {

    public static final String CASTING_OFFER_NEW = "CASTING_OFFER_NEW";
    public static final String CASTING_OFFER_DEADLINE = "CASTING_OFFER_DEADLINE";
    public static final String CASTING_OFFER_WITHDRAWN = "CASTING_OFFER_WITHDRAWN";
    public static final String CASTING_OFFER_READ = "CASTING_OFFER_READ";
    public static final String CASTING_OFFER_ACCEPTED = "CASTING_OFFER_ACCEPTED";
    public static final String CASTING_OFFER_DECLINED = "CASTING_OFFER_DECLINED";
    public static final String CHANNEL_NEW_VIDEO = "CHANNEL_NEW_VIDEO";

    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final NotificationSettingsService settings;

    public UserNotificationService(JdbcTemplate jdbc, ObjectMapper json, NotificationSettingsService settings) {
        this.jdbc = jdbc;
        this.json = json;
        this.settings = settings;
    }

    public record Row(UUID id, String type, String payload, String link, Instant createdAt, Instant readAt) {
    }

    public void notify(UUID userId, String type, Map<String, String> params, String link, String dedupeKey) {
        if (userId == null) {
            return;
        }
        if (!settings.get(userId).allows(type)) {
            return;
        }
        jdbc.update("""
                INSERT INTO user_notifications (id, user_id, notification_type, payload_json, link, dedupe_key)
                VALUES (?, ?, ?, ?::jsonb, ?, ?)
                ON CONFLICT DO NOTHING
                """, UUID.randomUUID(), userId, type, payload(type, params), link, dedupeKey);
    }

    /** 구독자 전원에게 새 공개 영상 알림. 같은 영상은 한 번만. */
    public int notifyFollowersOfVideo(UUID ownerId, UUID videoId, Map<String, String> params) {
        return jdbc.update("""
                INSERT INTO user_notifications (id, user_id, notification_type, payload_json, link, dedupe_key)
                SELECT gen_random_uuid(), s.subscriber_id, ?, ?::jsonb, ?, ?
                FROM channel_subscriptions s
                WHERE s.channel_owner_id = ? AND s.subscriber_id <> ?
                ON CONFLICT DO NOTHING
                """, CHANNEL_NEW_VIDEO, payload(CHANNEL_NEW_VIDEO, params), "/channel/" + ownerId,
                "video:" + videoId, ownerId, ownerId);
    }

    public List<Row> listFor(UUID userId, int limit) {
        return jdbc.query("""
                SELECT id, notification_type, payload_json::text AS payload, link, created_at, read_at
                FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
                """, (rs, i) -> new Row(rs.getObject("id", UUID.class), rs.getString("notification_type"),
                rs.getString("payload"), rs.getString("link"), ts(rs.getTimestamp("created_at")),
                ts(rs.getTimestamp("read_at"))), userId, limit);
    }

    public boolean markRead(UUID userId, UUID id) {
        return jdbc.update("UPDATE user_notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = ? AND user_id = ?",
                id, userId) > 0;
    }

    private String payload(String type, Map<String, String> params) {
        Map<String, Object> body = new LinkedHashMap<>();
        String base = camel(type);
        body.put("titleKey", base + "Title");
        body.put("bodyKey", base + "Body");
        Map<String, String> clean = new LinkedHashMap<>();
        if (params != null) {
            params.forEach((k, v) -> {
                if (v != null) {
                    clean.put(k, v.length() > 120 ? v.substring(0, 120) : v);
                }
            });
        }
        body.put("params", clean);
        try {
            return json.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    /** CASTING_OFFER_NEW → castingOfferNew (클라이언트 notifications 카탈로그 키 접두사). */
    static String camel(String type) {
        StringBuilder out = new StringBuilder();
        boolean up = false;
        for (char c : type.toLowerCase().toCharArray()) {
            if (c == '_') {
                up = true;
            } else {
                out.append(up ? Character.toUpperCase(c) : c);
                up = false;
            }
        }
        return out.toString();
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
