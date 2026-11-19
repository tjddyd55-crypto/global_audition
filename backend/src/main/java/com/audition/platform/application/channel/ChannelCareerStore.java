package com.audition.platform.application.channel;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ChannelCareerStore {

    public record Career(UUID id, UUID userId, String category, String title, String organization,
                         String periodStart, String periodEnd, String description, String sourceLocale,
                         boolean visible, int sortOrder, Instant createdAt, Instant updatedAt) {
    }

    private final JdbcTemplate jdbc;

    public ChannelCareerStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Career> list(UUID userId, boolean visibleOnly) {
        return jdbc.query("SELECT * FROM channel_careers WHERE user_id = ?" + (visibleOnly ? " AND visible" : "")
                        + " ORDER BY sort_order, period_start DESC NULLS LAST, created_at",
                (rs, n) -> map(rs), userId);
    }

    public Optional<Career> find(UUID id) {
        return jdbc.query("SELECT * FROM channel_careers WHERE id = ?", (rs, n) -> map(rs), id).stream().findFirst();
    }

    public int count(UUID userId) {
        Integer c = jdbc.queryForObject("SELECT COUNT(*) FROM channel_careers WHERE user_id = ?", Integer.class, userId);
        return c == null ? 0 : c;
    }

    public void insert(Career c) {
        jdbc.update("""
                INSERT INTO channel_careers (id, user_id, category, title, organization, period_start, period_end,
                    description, text_source_locale, visible, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                """, c.id(), c.userId(), c.category(), c.title(), c.organization(), c.periodStart(), c.periodEnd(),
                c.description(), c.sourceLocale(), c.visible(), c.sortOrder());
    }

    public void update(Career c) {
        jdbc.update("""
                UPDATE channel_careers SET category = ?, title = ?, organization = ?, period_start = ?, period_end = ?,
                    description = ?, text_source_locale = ?, visible = ?, sort_order = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ?
                """, c.category(), c.title(), c.organization(), c.periodStart(), c.periodEnd(), c.description(),
                c.sourceLocale(), c.visible(), c.sortOrder(), c.id(), c.userId());
    }

    public int delete(UUID id, UUID userId) {
        return jdbc.update("DELETE FROM channel_careers WHERE id = ? AND user_id = ?", id, userId);
    }

    private static Career map(ResultSet rs) throws SQLException {
        return new Career(rs.getObject("id", UUID.class), rs.getObject("user_id", UUID.class),
                rs.getString("category"), rs.getString("title"), rs.getString("organization"),
                rs.getString("period_start"), rs.getString("period_end"), rs.getString("description"),
                rs.getString("text_source_locale"), rs.getBoolean("visible"), rs.getInt("sort_order"),
                ts(rs.getTimestamp("created_at")), ts(rs.getTimestamp("updated_at")));
    }

    private static Instant ts(Timestamp t) {
        return t == null ? null : t.toInstant();
    }
}
