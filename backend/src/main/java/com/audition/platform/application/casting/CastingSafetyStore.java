package com.audition.platform.application.casting;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** 차단 · 신고 · 기획사 운영 제어. */
@Component
public class CastingSafetyStore {

    private final JdbcTemplate jdbc;

    public CastingSafetyStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Control(UUID agencyUserId, boolean restricted, String reason, Integer dailyLimit, String planCode,
                          Instant updatedAt) {
    }

    public record Report(UUID id, UUID offerId, UUID reporterUserId, UUID agencyUserId, String reason, String detail,
                         String status, String resolutionNote, Instant handledAt, Instant createdAt) {
    }

    public boolean blocked(UUID talentId, UUID agencyId) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM casting_agency_blocks WHERE talent_user_id = ? AND agency_user_id = ?",
                Integer.class, talentId, agencyId);
        return n != null && n > 0;
    }

    public void block(UUID talentId, UUID agencyId) {
        jdbc.update("""
                INSERT INTO casting_agency_blocks (id, talent_user_id, agency_user_id) VALUES (?, ?, ?)
                ON CONFLICT (talent_user_id, agency_user_id) DO NOTHING
                """, UUID.randomUUID(), talentId, agencyId);
    }

    public int unblock(UUID talentId, UUID agencyId) {
        return jdbc.update("DELETE FROM casting_agency_blocks WHERE talent_user_id = ? AND agency_user_id = ?",
                talentId, agencyId);
    }

    public List<UUID> blockedAgencies(UUID talentId) {
        return jdbc.query("SELECT agency_user_id FROM casting_agency_blocks WHERE talent_user_id = ? ORDER BY created_at DESC",
                (rs, i) -> rs.getObject(1, UUID.class), talentId);
    }

    public UUID report(UUID offerId, UUID reporter, UUID agencyId, String reason, String detail) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO casting_reports (id, offer_id, reporter_user_id, agency_user_id, reason, detail)
                VALUES (?, ?, ?, ?, ?, ?)
                """, id, offerId, reporter, agencyId, reason, detail);
        return id;
    }

    public List<Report> reports(String status) {
        String sql = """
                SELECT id, offer_id, reporter_user_id, agency_user_id, reason, detail, status, resolution_note,
                       handled_at, created_at FROM casting_reports
                """ + (status != null ? " WHERE status = ?" : "") + " ORDER BY created_at DESC LIMIT 300";
        List<Object> args = new ArrayList<>();
        if (status != null) {
            args.add(status);
        }
        return jdbc.query(sql, (rs, i) -> new Report(rs.getObject("id", UUID.class), rs.getObject("offer_id", UUID.class),
                rs.getObject("reporter_user_id", UUID.class), rs.getObject("agency_user_id", UUID.class),
                rs.getString("reason"), rs.getString("detail"), rs.getString("status"), rs.getString("resolution_note"),
                CastingOfferStore.ts(rs, "handled_at"), CastingOfferStore.ts(rs, "created_at")), args.toArray());
    }

    public Optional<Report> findReport(UUID id) {
        return reports(null).stream().filter(r -> r.id().equals(id)).findFirst();
    }

    public int resolveReport(UUID id, String status, String note, UUID admin) {
        return jdbc.update("""
                UPDATE casting_reports SET status = ?, resolution_note = ?, handled_by = ?, handled_at = NOW()
                WHERE id = ? AND status = 'OPEN'
                """, status, note, admin, id);
    }

    public Optional<Control> control(UUID agencyId) {
        return jdbc.query("""
                SELECT agency_user_id, offers_restricted, restricted_reason, daily_limit, plan_code, updated_at
                FROM agency_casting_controls WHERE agency_user_id = ?
                """, (rs, i) -> new Control(rs.getObject(1, UUID.class), rs.getBoolean(2), rs.getString(3),
                (Integer) rs.getObject(4), rs.getString(5), CastingOfferStore.ts(rs, "updated_at")), agencyId)
                .stream().findFirst();
    }

    public void upsertControl(UUID agencyId, boolean restricted, String reason, Integer dailyLimit, UUID admin) {
        jdbc.update("""
                INSERT INTO agency_casting_controls (agency_user_id, offers_restricted, restricted_reason, daily_limit, updated_by, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW())
                ON CONFLICT (agency_user_id) DO UPDATE SET offers_restricted = EXCLUDED.offers_restricted,
                    restricted_reason = EXCLUDED.restricted_reason, daily_limit = EXCLUDED.daily_limit,
                    updated_by = EXCLUDED.updated_by, updated_at = NOW()
                """, agencyId, restricted, reason, dailyLimit, admin);
    }

    public int openReportsAgainst(UUID agencyId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM casting_reports WHERE agency_user_id = ? AND status = 'OPEN'",
                Integer.class, agencyId);
        return n == null ? 0 : n;
    }
}
