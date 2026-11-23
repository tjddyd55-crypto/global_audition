package com.audition.platform.application.notifications;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationSettingsService {

    private final JdbcTemplate jdbc;

    public NotificationSettingsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public NotificationSettings get(UUID userId) {
        if (userId == null) {
            return NotificationSettings.defaults();
        }
        List<NotificationSettings> rows = jdbc.query("""
                SELECT saved_deadline, new_match, results, offers
                FROM user_notification_settings WHERE user_id = ?
                """, (rs, i) -> new NotificationSettings(
                rs.getBoolean("saved_deadline"),
                rs.getBoolean("new_match"),
                rs.getBoolean("results"),
                rs.getBoolean("offers")), userId);
        return rows.isEmpty() ? NotificationSettings.defaults() : rows.get(0);
    }

    public NotificationSettings upsert(UUID userId, NotificationSettings settings) {
        NotificationSettings next = settings == null ? NotificationSettings.defaults() : settings;
        jdbc.update("""
                INSERT INTO user_notification_settings
                    (user_id, saved_deadline, new_match, results, offers, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    saved_deadline = EXCLUDED.saved_deadline,
                    new_match = EXCLUDED.new_match,
                    results = EXCLUDED.results,
                    offers = EXCLUDED.offers,
                    updated_at = NOW()
                """, userId, next.savedDeadline(), next.newMatch(), next.results(), next.offers());
        return next;
    }
}
