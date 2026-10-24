package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * scripts/dev QA 시드를 실제 로컬 Postgres(V1..V60)에 반복 실행해
 * 중복 데이터·원장 없는 잔액·고아 지원비 원장이 생기지 않음을 검증한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class QaSeedIdempotencyIT {

    private static final Path DEV = Path.of("..", "scripts", "dev");
    private static final UUID QA_APPLICANT = UUID.fromString("00000006-0000-4000-8000-000000000006");
    private static final UUID FRESH = UUID.fromString("00000010-0000-4000-8000-000000000010");
    private static final UUID EXISTING = UUID.fromString("00000015-0000-4000-8000-000000000015");

    @DynamicPropertySource
    static void db(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
    }

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private ApplicationSubmitService applications;

    private long originalFee;

    @BeforeEach
    void setUp() {
        originalFee = jdbc.queryForObject("SELECT amount_usd FROM platform_application_fee WHERE id = 1", Long.class);
        jdbc.update("UPDATE platform_application_fee SET amount_usd = 1 WHERE id = 1");
    }

    @AfterEach
    void tearDown() throws Exception {
        SecurityContextHolder.clearContext();
        jdbc.update("UPDATE platform_application_fee SET amount_usd = ? WHERE id = 1", originalFee);
        // 테스트가 만든 지원비 원장/지원서를 지운 뒤 정리 스크립트의 정상 경로로 시드를 제거한다.
        jdbc.update("DELETE FROM credit_transactions WHERE user_id = ? AND type = 'USE'", QA_APPLICANT);
        jdbc.update("DELETE FROM applications WHERE applicant_id = ? AND audition_id = ?", QA_APPLICANT, FRESH);
        jdbc.update("UPDATE user_credits SET balance = (SELECT COALESCE(SUM(amount),0) FROM credit_transactions WHERE user_id = ?) WHERE user_id = ?",
                QA_APPLICANT, QA_APPLICANT);
        run("cleanup-native-qa-develop.sql", true);
        assertEquals(0, count("SELECT COUNT(*) FROM users WHERE email LIKE 'qa-dev-%@audition.local'"));
        assertEquals(0, count("SELECT COUNT(*) FROM auditions WHERE title LIKE '[DEV-QA]%'"));
        assertEquals(0, count("SELECT COUNT(*) FROM credit_transactions WHERE reference_id LIKE 'QA_SEED:%'"));
    }

    @Test
    void seedRunsRepeatedlyWithoutDuplicatesAndKeepsLedgerEqualToBalance() throws Exception {
        long otherWallets = count("SELECT COUNT(*) FROM user_credits WHERE user_id::text NOT LIKE '0000000%'");
        long otherWalletSum = sumLong("SELECT COALESCE(SUM(balance),0) FROM user_credits WHERE user_id::text NOT LIKE '0000000%'");

        // 환경 가드: 세션 플래그 없이 실행하면 거부되고 아무것도 생성되지 않는다.
        assertThrows(SQLException.class, () -> run("seed-native-qa-develop.sql", false));
        assertEquals(0, count("SELECT COUNT(*) FROM users WHERE id = '" + QA_APPLICANT + "'"));

        run("seed-native-qa-develop.sql", true);
        Snapshot first = snapshot();
        run("seed-native-qa-develop.sql", true);
        Snapshot second = snapshot();
        assertEquals(first, second, "second seed run must not change anything");
        assertEquals(new Snapshot(6, 6, 4, 4, 2, 10, 10, 1), first);

        // 실제 API 서비스 경로로 지원 (1 크레딧) → 재시드 후에도 잔액 재설정/중복 없음
        asApplicant();
        applications.submitApplication(request(FRESH));
        ResponseStatusException existing = assertThrows(ResponseStatusException.class,
                () -> applications.submitApplication(request(EXISTING)));
        assertEquals(409, existing.getStatusCode().value());
        run("seed-native-qa-develop.sql", true);
        run("seed-native-qa-develop.sql", true);
        assertEquals(9L, sumLong("SELECT balance FROM user_credits WHERE user_id = '" + QA_APPLICANT + "'"));
        assertEquals(9L, sumLong("SELECT SUM(amount) FROM credit_transactions WHERE user_id = '" + QA_APPLICANT + "'"));
        assertEquals(0, count("""
                SELECT COUNT(*) FROM (SELECT 1 FROM credit_transactions
                WHERE type = 'USE' AND reason = 'AUDITION_APPLY' AND reference_id IS NOT NULL
                GROUP BY user_id, reference_id HAVING COUNT(*) > 1) d
                """));

        // 지원비 원장이 걸린 QA 오디션은 정리 스크립트가 삭제를 거부한다 (트랜잭션 전체 롤백).
        SQLException refused = assertThrows(SQLException.class, () -> run("cleanup-native-qa-develop.sql", true));
        assertTrue(refused.getMessage().contains("QA cleanup refused"), refused.getMessage());
        assertEquals(6, count("SELECT COUNT(*) FROM auditions WHERE title LIKE '[DEV-QA]%'"));
        assertEquals(1, count("SELECT COUNT(*) FROM applications WHERE applicant_id = '" + QA_APPLICANT + "' AND audition_id = '" + FRESH + "'"));

        // QA 외 기존 지갑은 시드가 건드리지 않는다.
        assertEquals(otherWallets, count("SELECT COUNT(*) FROM user_credits WHERE user_id::text NOT LIKE '0000000%'"));
        assertEquals(otherWalletSum, sumLong("SELECT COALESCE(SUM(balance),0) FROM user_credits WHERE user_id::text NOT LIKE '0000000%'"));
    }

    record Snapshot(long users, long auditions, long applications, long videos, long channelVideos,
                    long balance, long ledgerSum, long ledgerRows) {
    }

    private Snapshot snapshot() {
        String u = "'" + QA_APPLICANT + "'";
        return new Snapshot(
                count("SELECT COUNT(*) FROM users WHERE email LIKE 'qa-dev-%@audition.local'"),
                count("SELECT COUNT(*) FROM auditions WHERE title LIKE '[DEV-QA]%'"),
                count("SELECT COUNT(*) FROM applications WHERE audition_id::text LIKE '000000%'"),
                count("SELECT COUNT(*) FROM application_videos WHERE id::text LIKE '000000%'"),
                count("SELECT COUNT(*) FROM channel_videos WHERE title LIKE '[DEV-QA]%'"),
                sumLong("SELECT balance FROM user_credits WHERE user_id = " + u),
                sumLong("SELECT COALESCE(SUM(amount),0) FROM credit_transactions WHERE user_id = " + u),
                count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = " + u));
    }

    private void run(String file, boolean developmentFlag) throws Exception {
        String sql = Files.readString(DEV.resolve(file), StandardCharsets.UTF_8);
        try (Connection c = dataSource.getConnection(); Statement st = c.createStatement()) {
            c.setAutoCommit(true);
            try {
                st.execute(developmentFlag ? "SET app.qa_seed_env = 'development'" : "RESET app.qa_seed_env");
                st.execute(sql);
            } catch (SQLException e) {
                st.execute("ROLLBACK");
                throw e;
            } finally {
                st.execute("RESET app.qa_seed_env");
            }
        }
    }

    private long count(String sql) {
        Long n = jdbc.queryForObject(sql, Long.class);
        return n == null ? 0 : n;
    }

    private long sumLong(String sql) {
        List<Long> rows = jdbc.queryForList(sql, Long.class);
        return rows.isEmpty() || rows.get(0) == null ? 0 : rows.get(0);
    }

    private static CreateApplicationRequest request(UUID audition) {
        CreateApplicationRequest r = new CreateApplicationRequest();
        r.setAuditionId(audition);
        r.setName("QA Dev Applicant");
        r.setNationality("KR");
        r.setVideoUrl("https://www.youtube.com/watch?v=aqz-KE-bpKQ");
        return r;
    }

    private static void asApplicant() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                QA_APPLICANT, "n/a", List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));
    }
}
