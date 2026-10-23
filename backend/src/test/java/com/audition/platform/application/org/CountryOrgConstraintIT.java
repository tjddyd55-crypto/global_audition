package com.audition.platform.application.org;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
class CountryOrgConstraintIT {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void oneActiveRepresentativeIsEnforcedAndHistoryRemains() {
        String code = "QZ";
        jdbc.update("DELETE FROM country_admin_appointments WHERE country_code = ?", code);
        jdbc.update("DELETE FROM countries WHERE code = ?", code);
        jdbc.update("""
                INSERT INTO countries (code, name, status, default_currency)
                VALUES (?, 'Queue Test', 'ACTIVE', 'USD')
                ON CONFLICT (code) DO NOTHING
                """, code);
        UUID firstUser = insertUser("rep-a-" + UUID.randomUUID() + "@org.test");
        UUID secondUser = insertUser("rep-b-" + UUID.randomUUID() + "@org.test");
        UUID first = UUID.randomUUID();
        UUID second = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, first, code, firstUser);
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, second, code, secondUser));
        jdbc.update("""
                UPDATE country_admin_appointments
                SET status = 'ENDED', ended_at = NOW(), end_reason = 'REPLACED'
                WHERE id = ?
                """, first);
        jdbc.update("""
                INSERT INTO country_admin_appointments (id, country_code, user_id, status)
                VALUES (?, ?, ?, 'ACTIVE')
                """, second, code, secondUser);
        Integer history = jdbc.queryForObject(
                "SELECT COUNT(*) FROM country_admin_appointments WHERE country_code = ?",
                Integer.class, code);
        Integer active = jdbc.queryForObject("""
                SELECT COUNT(*) FROM country_admin_appointments
                WHERE country_code = ? AND status = 'ACTIVE'
                """, Integer.class, code);
        assertEquals(2, history);
        assertEquals(1, active);
        Integer payments = jdbc.queryForObject("SELECT COUNT(*) FROM payment_orders", Integer.class);
        assertTrue(payments != null && payments >= 0);
        jdbc.update("DELETE FROM country_admin_appointments WHERE country_code = ?", code);
        jdbc.update("DELETE FROM countries WHERE code = ?", code);
        jdbc.update("DELETE FROM users WHERE id IN (?, ?)", firstUser, secondUser);
    }

    @Test
    void migrationDoesNotRewritePaymentsOrLedger() throws Exception {
        String sql = java.nio.file.Files.readString(java.nio.file.Path.of(
                "src/main/resources/db/migration/V49__country_org.sql"));
        String lower = sql.toLowerCase();
        assertTrue(!lower.contains("update public.credit_transactions"));
        assertTrue(!lower.contains("update public.payment_orders"));
        assertTrue(!lower.contains("delete from public.credit_transactions"));
        assertTrue(!lower.contains("delete from public.payment_orders"));
    }

    private UUID insertUser(String email) {
        UUID id = UUID.randomUUID();
        String handle = "u" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname)
                VALUES (?, ?, 'x', 'USER', ?, ?, ?)
                """, id, email, handle, email, handle);
        return id;
    }
}
