package com.audition.platform.application.org;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcOrgStore implements OrgDirectory {

    private final JdbcTemplate jdbc;

    public JdbcOrgStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public String roleOf(UUID userId) {
        List<String> rows = jdbc.query(
                "SELECT role FROM users WHERE id = ?",
                (rs, n) -> rs.getString("role"),
                userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Override
    public String activeRepCountry(UUID userId) {
        return one("""
                SELECT country_code FROM country_admin_appointments
                WHERE user_id = ? AND status = 'ACTIVE'
                """, userId);
    }

    @Override
    public String activeStaffCountry(UUID userId) {
        return one("""
                SELECT country_code FROM country_staff_assignments
                WHERE user_id = ? AND status = 'ACTIVE'
                """, userId);
    }

    @Override
    public boolean staffHas(UUID userId, String countryCode, String permission) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM country_staff_assignments a
                JOIN country_staff_permissions p ON p.assignment_id = a.id
                WHERE a.user_id = ? AND a.country_code = ? AND a.status = 'ACTIVE' AND p.permission = ?
                """, Integer.class, userId, countryCode, permission);
        return count != null && count > 0;
    }

    @Override
    public boolean staffAssigned(UUID userId, String countryCode, UUID crmAgencyId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM country_staff_assignments a
                JOIN country_staff_agencies g ON g.assignment_id = a.id
                WHERE a.user_id = ? AND a.country_code = ? AND a.status = 'ACTIVE' AND g.crm_agency_id = ?
                """, Integer.class, userId, countryCode, crmAgencyId);
        return count != null && count > 0;
    }

    public boolean countryExists(String code) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM countries WHERE code = ?", Integer.class, code);
        return count != null && count > 0;
    }

    public void insertCountry(String code, String name, String status, String currency) {
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, ?, ?, ?)
                """, code, name, status, currency);
    }

    public List<CountryRow> listCountries() {
        return jdbc.query("""
                SELECT c.code, c.name, c.status, c.default_currency, a.user_id
                FROM countries c
                LEFT JOIN country_admin_appointments a
                  ON a.country_code = c.code AND a.status = 'ACTIVE'
                ORDER BY c.code
                """, (rs, n) -> new CountryRow(
                rs.getString("code"),
                rs.getString("name"),
                rs.getString("status"),
                rs.getString("default_currency"),
                rs.getObject("user_id", UUID.class)));
    }

    public Optional<UUID> activeAppointmentId(String countryCode) {
        List<UUID> rows = jdbc.query("""
                SELECT id FROM country_admin_appointments
                WHERE country_code = ? AND status = 'ACTIVE'
                """, (rs, n) -> rs.getObject("id", UUID.class), countryCode);
        return rows.stream().findFirst();
    }

    public void endAppointment(UUID id, Instant endedAt, String reason, UUID successorId) {
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ENDED', ended_at = ?, end_reason = ?, successor_appointment_id = ?
                WHERE id = ? AND status = 'ACTIVE'
                """, Timestamp.from(endedAt), reason, successorId, id);
    }

    public void insertAppointment(UUID id, String countryCode, UUID userId, UUID appointedBy, Instant at) {
        jdbc.update("""
                INSERT INTO country_admin_appointments
                    (id, country_code, user_id, status, appointed_by, appointed_at)
                VALUES (?, ?, ?, 'ACTIVE', ?, ?)
                """, id, countryCode, userId, appointedBy, Timestamp.from(at));
    }

    public List<AppointmentRow> appointmentHistory(String countryCode) {
        return jdbc.query("""
                SELECT id, user_id, status, appointed_at, ended_at, end_reason
                FROM country_admin_appointments
                WHERE country_code = ?
                ORDER BY appointed_at
                """, (rs, n) -> new AppointmentRow(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("status"),
                rs.getTimestamp("appointed_at").toInstant(),
                rs.getTimestamp("ended_at") == null ? null : rs.getTimestamp("ended_at").toInstant(),
                rs.getString("end_reason")), countryCode);
    }

    public void setRoleIfNotHq(UUID userId, String role) {
        jdbc.update("""
                UPDATE users SET role = ?, updated_at = NOW()
                WHERE id = ? AND role NOT IN ('SUPER_ADMIN', 'GLOBAL_SUPER_ADMIN')
                """, role, userId);
    }

    public int activeAppointmentCount(UUID userId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM country_admin_appointments
                WHERE user_id = ? AND status = 'ACTIVE'
                """, Integer.class, userId);
        return count == null ? 0 : count;
    }

    public boolean permissionGrantable(String permission) {
        List<Boolean> rows = jdbc.query(
                "SELECT grantable_by_country_admin FROM country_permission_catalog WHERE permission = ?",
                (rs, n) -> rs.getBoolean(1),
                permission);
        return !rows.isEmpty() && Boolean.TRUE.equals(rows.get(0));
    }

    public Optional<UUID> activeStaffAssignment(String countryCode, UUID userId) {
        List<UUID> rows = jdbc.query("""
                SELECT id FROM country_staff_assignments
                WHERE country_code = ? AND user_id = ? AND status = 'ACTIVE'
                """, (rs, n) -> rs.getObject("id", UUID.class), countryCode, userId);
        return rows.stream().findFirst();
    }

    public void insertStaff(UUID id, String countryCode, UUID userId, UUID appointedBy, Instant at) {
        jdbc.update("""
                INSERT INTO country_staff_assignments
                    (id, country_code, user_id, status, appointed_by, appointed_at)
                VALUES (?, ?, ?, 'ACTIVE', ?, ?)
                """, id, countryCode, userId, appointedBy, Timestamp.from(at));
    }

    public void grantPermission(UUID assignmentId, String permission) {
        jdbc.update("""
                INSERT INTO country_staff_permissions (assignment_id, permission)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """, assignmentId, permission);
    }

    public void audit(UUID id, String action, UUID actorId, String countryCode, String targetType, String targetId, String detail) {
        jdbc.update("""
                INSERT INTO country_org_audit
                    (id, action, actor_id, country_code, target_type, target_id, detail)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, action, actorId, countryCode, targetType, targetId, detail);
    }

    private String one(String sql, UUID userId) {
        List<String> rows = jdbc.query(sql, (rs, n) -> rs.getString(1), userId);
        return rows.isEmpty() ? null : rows.get(0).trim();
    }

    public record CountryRow(String code, String name, String status, String currency, UUID representativeUserId) {
    }

    public record AppointmentRow(
            UUID id, UUID userId, String status, Instant appointedAt, Instant endedAt, String endReason) {
    }
}
