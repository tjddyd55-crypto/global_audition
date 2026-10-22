package com.audition.platform.application.org;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcCrmStore {

    private final JdbcTemplate jdbc;

    public JdbcCrmStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertAgency(AgencyRow row) {
        jdbc.update("""
                INSERT INTO crm_agencies (
                    id, country_code, display_name, legal_name, business_registration,
                    contact_name, contact_email, contact_phone, website,
                    assigned_staff_user_id, stage, approval_state, linked_user_id, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.countryCode(), row.displayName(), row.legalName(), row.businessRegistration(),
                row.contactName(), row.contactEmail(), row.contactPhone(), row.website(),
                row.assignedStaffUserId(), row.stage(), row.approvalState(), row.linkedUserId(), row.notes());
    }

    public Optional<AgencyRow> find(UUID id) {
        List<AgencyRow> rows = jdbc.query("SELECT * FROM crm_agencies WHERE id = ?", (rs, n) -> map(rs), id);
        return rows.stream().findFirst();
    }

    public void updateState(UUID id, String stage, String approval, UUID linkedUserId) {
        jdbc.update("""
                UPDATE crm_agencies
                SET stage = ?, approval_state = ?, linked_user_id = COALESCE(?, linked_user_id), updated_at = NOW()
                WHERE id = ?
                """, stage, approval, linkedUserId, id);
    }

    public List<AgencyRow> listCountry(String countryCode) {
        return jdbc.query("SELECT * FROM crm_agencies WHERE country_code = ? ORDER BY created_at",
                (rs, n) -> map(rs), countryCode);
    }

    public List<AgencyRow> listAssigned(UUID staffUserId, String countryCode) {
        return jdbc.query("""
                SELECT a.* FROM crm_agencies a
                JOIN country_staff_agencies g ON g.crm_agency_id = a.id
                JOIN country_staff_assignments s ON s.id = g.assignment_id
                WHERE s.user_id = ? AND s.country_code = ? AND s.status = 'ACTIVE' AND a.country_code = ?
                ORDER BY a.created_at
                """, (rs, n) -> map(rs), staffUserId, countryCode, countryCode);
    }

    public void stageEvent(UUID id, UUID agencyId, String from, String to, UUID actor, String reason) {
        jdbc.update("""
                INSERT INTO crm_stage_events (id, crm_agency_id, from_stage, to_stage, actor_id, reason)
                VALUES (?, ?, ?, ?, ?, ?)
                """, id, agencyId, from, to, actor, reason);
    }

    public void approvalEvent(UUID id, UUID agencyId, String from, String to, String action, UUID actor, String reason) {
        jdbc.update("""
                INSERT INTO crm_approval_events
                    (id, crm_agency_id, from_state, to_state, action, actor_id, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, agencyId, from, to, action, actor, reason);
    }

    public void activity(UUID id, UUID agencyId, String country, UUID actor, String kind, String body, LocalDate followUpOn) {
        jdbc.update("""
                INSERT INTO crm_activities (id, crm_agency_id, country_code, actor_id, kind, body, follow_up_on)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, agencyId, country, actor, kind, body, followUpOn == null ? null : Date.valueOf(followUpOn));
    }

    public Optional<ActivityRow> findActivity(UUID id) {
        List<ActivityRow> rows = jdbc.query("""
                SELECT id, crm_agency_id, actor_id, kind, body, follow_up_on, created_at
                FROM crm_activities
                WHERE id = ?
                """, (rs, n) -> new ActivityRow(
                rs.getObject("id", UUID.class),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getObject("actor_id", UUID.class),
                rs.getString("kind"),
                rs.getString("body"),
                rs.getDate("follow_up_on") == null ? null : rs.getDate("follow_up_on").toLocalDate(),
                rs.getTimestamp("created_at").toInstant()), id);
        return rows.stream().findFirst();
    }

    public int updateConsult(UUID id, String country, UUID actorId, String body, LocalDate followUpOn) {
        String sql = """
                UPDATE crm_activities
                SET body = ?, follow_up_on = ?
                WHERE id = ? AND country_code = ? AND kind = 'CONSULT'
                """;
        if (actorId == null) {
            return jdbc.update(sql, body, followUpOn == null ? null : Date.valueOf(followUpOn), id, country);
        }
        return jdbc.update(sql + " AND actor_id = ?", body, followUpOn == null ? null : Date.valueOf(followUpOn), id, country, actorId);
    }

    public List<ActivityRow> activities(String countryCode, UUID actorId, UUID agencyId) {
        String sql = """
                SELECT id, crm_agency_id, actor_id, kind, body, follow_up_on, created_at
                FROM crm_activities
                WHERE country_code = ?
                """;
        List<Object> args = new java.util.ArrayList<>();
        args.add(countryCode);
        if (actorId != null) {
            sql += " AND actor_id = ?";
            args.add(actorId);
        }
        if (agencyId != null) {
            sql += " AND crm_agency_id = ?";
            args.add(agencyId);
        }
        sql += " ORDER BY created_at DESC";
        return jdbc.query(sql, (rs, n) -> new ActivityRow(
                rs.getObject("id", UUID.class),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getObject("actor_id", UUID.class),
                rs.getString("kind"),
                rs.getString("body"),
                rs.getDate("follow_up_on") == null ? null : rs.getDate("follow_up_on").toLocalDate(),
                rs.getTimestamp("created_at").toInstant()), args.toArray());
    }

    public int linkAudition(UUID agencyId, UUID auditionId) {
        return jdbc.update("""
                UPDATE auditions
                SET posting_branch_id = ?
                WHERE id = ? AND (posting_branch_id IS NULL OR posting_branch_id = ?)
                """, agencyId, auditionId, agencyId);
    }

    public void assign(UUID assignmentId, UUID agencyId) {
        jdbc.update("""
                INSERT INTO country_staff_agencies (assignment_id, crm_agency_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """, assignmentId, agencyId);
    }

    public List<AgencyRow> findByLinkedUser(UUID userId) {
        return jdbc.query("SELECT * FROM crm_agencies WHERE linked_user_id = ? ORDER BY created_at",
                (rs, n) -> map(rs), userId);
    }

    public List<ActivityCount> activityCounts(String countryCode, UUID actorId) {
        String sql = """
                SELECT actor_id, kind, COUNT(*) AS total
                FROM crm_activities
                WHERE country_code = ?
                """;
        if (actorId != null) {
            sql += " AND actor_id = ?";
        }
        sql += " GROUP BY actor_id, kind ORDER BY total DESC";
        Object[] args = actorId == null ? new Object[] {countryCode} : new Object[] {countryCode, actorId};
        return jdbc.query(sql, (rs, n) -> new ActivityCount(
                rs.getObject("actor_id", UUID.class),
                rs.getString("kind"),
                rs.getLong("total")), args);
    }

    public int countEvents(UUID agencyId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM crm_approval_events WHERE crm_agency_id = ?", Integer.class, agencyId);
        return count == null ? 0 : count;
    }

    private static AgencyRow map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new AgencyRow(
                rs.getObject("id", UUID.class),
                rs.getString("country_code").trim(),
                rs.getString("display_name"),
                rs.getString("legal_name"),
                rs.getString("business_registration"),
                rs.getString("contact_name"),
                rs.getString("contact_email"),
                rs.getString("contact_phone"),
                rs.getString("website"),
                rs.getObject("assigned_staff_user_id", UUID.class),
                rs.getString("stage"),
                rs.getString("approval_state"),
                rs.getObject("linked_user_id", UUID.class),
                rs.getString("notes"));
    }

    public record ActivityCount(UUID actorId, String kind, long total) {
    }

    public record ActivityRow(
            UUID id,
            UUID agencyId,
            UUID actorId,
            String kind,
            String body,
            LocalDate followUpOn,
            Instant createdAt) {
    }

    public record AgencyRow(
            UUID id,
            String countryCode,
            String displayName,
            String legalName,
            String businessRegistration,
            String contactName,
            String contactEmail,
            String contactPhone,
            String website,
            UUID assignedStaffUserId,
            String stage,
            String approvalState,
            UUID linkedUserId,
            String notes) {
    }
}
