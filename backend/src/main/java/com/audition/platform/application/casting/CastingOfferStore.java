package com.audition.platform.application.casting;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** casting_offers / casting_offer_events JDBC 저장소. 상태 변경은 현재 상태 조건부 UPDATE 로만 한다. */
@Component
public class CastingOfferStore {

    private final JdbcTemplate jdbc;

    public CastingOfferStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Offer(
            UUID id,
            UUID agencyUserId,
            UUID branchId,
            UUID talentUserId,
            String status,
            String title,
            String projectType,
            String roleField,
            String message,
            String workCountry,
            String workLocation,
            String scheduleText,
            String compensationType,
            String compensationNote,
            UUID auditionId,
            boolean contactRequested,
            boolean contactShared,
            String sourceLocale,
            Instant expiresAt,
            Instant readAt,
            Instant respondedAt,
            String responseReason,
            String responseNote,
            Instant withdrawnAt,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record Event(String fromStatus, String toStatus, String actorKind, String note, Instant createdAt) {
    }

    private static final String COLS = """
            id, agency_user_id, agency_branch_id, talent_user_id, status, title, project_type, role_field, message,
            work_country, work_location, schedule_text, compensation_type, compensation_note, audition_id,
            contact_requested, contact_shared, text_source_locale, expires_at, read_at, responded_at,
            response_reason, response_note, withdrawn_at, created_at, updated_at
            """;

    private static final RowMapper<Offer> MAPPER = (rs, i) -> new Offer(
            rs.getObject("id", UUID.class), rs.getObject("agency_user_id", UUID.class),
            rs.getObject("agency_branch_id", UUID.class), rs.getObject("talent_user_id", UUID.class),
            rs.getString("status"), rs.getString("title"), rs.getString("project_type"), rs.getString("role_field"),
            rs.getString("message"), rs.getString("work_country"), rs.getString("work_location"),
            rs.getString("schedule_text"), rs.getString("compensation_type"), rs.getString("compensation_note"),
            rs.getObject("audition_id", UUID.class), rs.getBoolean("contact_requested"),
            rs.getBoolean("contact_shared"), rs.getString("text_source_locale"), ts(rs, "expires_at"),
            ts(rs, "read_at"), ts(rs, "responded_at"), rs.getString("response_reason"), rs.getString("response_note"),
            ts(rs, "withdrawn_at"), ts(rs, "created_at"), ts(rs, "updated_at"));

    /** 기획사별 트랜잭션 범위 advisory lock. 호출 트랜잭션이 끝날 때 풀린다. */
    public void lockAgency(UUID agencyUserId) {
        jdbc.query("select pg_advisory_xact_lock(hashtextextended(?, 147))", rs -> { }, "casting-send:" + agencyUserId);
    }

    public UUID insert(UUID agencyUserId, CastingRules.CleanOffer o, UUID branchId) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO casting_offers (id, agency_user_id, agency_branch_id, talent_user_id, status, title,
                    project_type, role_field, message, work_country, work_location, schedule_text, compensation_type,
                    compensation_note, audition_id, contact_requested, text_source_locale, expires_at)
                VALUES (?, ?, ?, ?, 'SENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, id, agencyUserId, branchId, o.talentUserId(), o.title(), o.projectType(), o.roleField(),
                o.message(), o.workCountry(), o.workLocation(), o.scheduleText(), o.compensationType(),
                o.compensationNote(), o.auditionId(), o.contactRequested(), o.sourceLocale(),
                Timestamp.from(o.expiresAt()));
        event(id, null, CastingOfferStatus.SENT, agencyUserId, CastingOfferStatus.ACTOR_AGENCY, null);
        return id;
    }

    public Optional<Offer> find(UUID id) {
        return jdbc.query("SELECT " + COLS + " FROM casting_offers WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    public List<Offer> forTalent(UUID talentId) {
        return jdbc.query("SELECT " + COLS + " FROM casting_offers WHERE talent_user_id = ? ORDER BY created_at DESC LIMIT 200",
                MAPPER, talentId);
    }

    public List<Offer> forAgency(UUID agencyId, String status, UUID talentId) {
        StringBuilder sql = new StringBuilder("SELECT " + COLS + " FROM casting_offers WHERE agency_user_id = ?");
        List<Object> args = new ArrayList<>(List.of(agencyId));
        if (status != null) {
            sql.append(" AND status = ?");
            args.add(status);
        }
        if (talentId != null) {
            sql.append(" AND talent_user_id = ?");
            args.add(talentId);
        }
        sql.append(" ORDER BY created_at DESC LIMIT 300");
        return jdbc.query(sql.toString(), MAPPER, args.toArray());
    }

    /** 현재 상태가 from 일 때만 바꾼다(동시 응답 경합 방지). */
    public boolean transition(UUID id, String from, String to, UUID actor, String actorKind, String note,
                              String reason, Boolean contactShared) {
        String extra = switch (to) {
            case CastingOfferStatus.READ -> ", read_at = COALESCE(read_at, NOW())";
            case CastingOfferStatus.ACCEPTED, CastingOfferStatus.DECLINED ->
                    ", responded_at = NOW(), read_at = COALESCE(read_at, NOW())";
            case CastingOfferStatus.WITHDRAWN -> ", withdrawn_at = NOW()";
            default -> "";
        };
        int n = jdbc.update("UPDATE casting_offers SET status = ?, updated_at = NOW()" + extra
                        + ", response_reason = COALESCE(?, response_reason), response_note = COALESCE(?, response_note)"
                        + ", contact_shared = COALESCE(?, contact_shared) WHERE id = ? AND status = ?",
                to, reason, isResponse(to) ? note : null, contactShared, id, from);
        if (n == 1) {
            event(id, from, to, actor, actorKind, isResponse(to) ? null : note);
        }
        return n == 1;
    }

    private static boolean isResponse(String to) {
        return CastingOfferStatus.ACCEPTED.equals(to) || CastingOfferStatus.DECLINED.equals(to);
    }

    public void event(UUID offerId, String from, String to, UUID actor, String kind, String note) {
        jdbc.update("""
                INSERT INTO casting_offer_events (id, offer_id, from_status, to_status, actor_user_id, actor_kind, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, UUID.randomUUID(), offerId, from, to, actor, kind, note);
    }

    public List<Event> events(UUID offerId) {
        return jdbc.query("""
                SELECT from_status, to_status, actor_kind, note, created_at FROM casting_offer_events
                WHERE offer_id = ? ORDER BY created_at, id
                """, (rs, i) -> new Event(rs.getString("from_status"), rs.getString("to_status"),
                rs.getString("actor_kind"), rs.getString("note"), ts(rs, "created_at")), offerId);
    }

    public int countSentSince(UUID agencyId, Instant since) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM casting_offers WHERE agency_user_id = ? AND created_at >= ?",
                Integer.class, agencyId, Timestamp.from(since));
        return n == null ? 0 : n;
    }

    public int countPairSince(UUID agencyId, UUID talentId, Instant since) {
        Integer n = jdbc.queryForObject("""
                SELECT COUNT(*) FROM casting_offers WHERE agency_user_id = ? AND talent_user_id = ? AND created_at >= ?
                """, Integer.class, agencyId, talentId, Timestamp.from(since));
        return n == null ? 0 : n;
    }

    public boolean hasOpenPair(UUID agencyId, UUID talentId) {
        Integer n = jdbc.queryForObject("""
                SELECT COUNT(*) FROM casting_offers
                WHERE agency_user_id = ? AND talent_user_id = ? AND status IN ('SENT', 'READ')
                """, Integer.class, agencyId, talentId);
        return n != null && n > 0;
    }

    public Optional<Instant> lastDeclinedAt(UUID agencyId, UUID talentId) {
        return jdbc.query("""
                SELECT responded_at FROM casting_offers
                WHERE agency_user_id = ? AND talent_user_id = ? AND status = 'DECLINED'
                ORDER BY responded_at DESC NULLS LAST LIMIT 1
                """, (rs, i) -> ts(rs, "responded_at"), agencyId, talentId).stream().filter(x -> x != null).findFirst();
    }

    public List<Offer> dueForExpiry(Instant now) {
        return jdbc.query("SELECT " + COLS + " FROM casting_offers WHERE status IN ('SENT','READ') AND expires_at < ? LIMIT 500",
                MAPPER, Timestamp.from(now));
    }

    public List<Offer> dueForDeadlineNotice(Instant now, Instant until) {
        return jdbc.query("SELECT " + COLS + """
                 FROM casting_offers WHERE status IN ('SENT','READ') AND deadline_notified_at IS NULL
                 AND expires_at >= ? AND expires_at < ? LIMIT 500
                """, MAPPER, Timestamp.from(now), Timestamp.from(until));
    }

    public void markDeadlineNotified(UUID id) {
        jdbc.update("UPDATE casting_offers SET deadline_notified_at = NOW() WHERE id = ?", id);
    }

    static Instant ts(ResultSet rs, String col) throws SQLException {
        Timestamp t = rs.getTimestamp(col);
        return t == null ? null : t.toInstant();
    }

    static Date date(java.time.LocalDate d) {
        return d == null ? null : Date.valueOf(d);
    }
}
