package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.infra.TestDatabase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 크레딧 지원비 무결성 회귀 테스트 (실제 로컬 Postgres, V1..V60 적용 스키마).
 * V39 장애(동일 사용자·오디션 USE/AUDITION_APPLY 중복)가 애플리케이션 경로로 재발하지 않음을 검증한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
        "spring.datasource.hikari.maximum-pool-size=10",
})
class CreditApplyIntegrityIT {

    private static final String DOMAIN = "@credit.integrity.test";
    private static final String VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    @DynamicPropertySource
    static void db(DynamicPropertyRegistry r) {
        TestDatabase.register(r);
    }

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ApplicationSubmitService applications;
    @Autowired
    private CreditService credits;

    private long originalFee;
    private UUID owner;
    private final List<UUID> auditions = new ArrayList<>();

    @BeforeEach
    void setUp() {
        originalFee = jdbc.queryForObject("SELECT amount_usd FROM platform_application_fee WHERE id = 1", Long.class);
        jdbc.update("UPDATE platform_application_fee SET amount_usd = 1 WHERE id = 1");
        owner = user("AGENCY");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        jdbc.update("UPDATE platform_application_fee SET amount_usd = ? WHERE id = 1", originalFee);
        for (UUID a : auditions) {
            jdbc.update("DELETE FROM auditions WHERE id = ?", a);
        }
        jdbc.update("DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)", "%" + DOMAIN);
        jdbc.update("DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)", "%" + DOMAIN);
        jdbc.update("DELETE FROM users WHERE email LIKE ?", "%" + DOMAIN);
    }

    /** 1) 동일 오디션 중복 지원 차단 + 3) 재시도 시 중복 차감 없음 */
    @Test
    void duplicateApplicationAndClientRetryAreRejectedWithoutSecondCharge() {
        UUID applicant = user("APPLICANT");
        UUID audition = audition();
        credits.grantCredits(applicant, 5, "PROMOTION", null, null, "it");
        asUser(applicant);

        applications.submitApplication(request(audition));
        for (int retry = 0; retry < 3; retry++) {
            ResponseStatusException dup = assertThrows(ResponseStatusException.class,
                    () -> applications.submitApplication(request(audition)));
            assertEquals(409, dup.getStatusCode().value());
        }

        assertEquals(1, count("SELECT COUNT(*) FROM applications WHERE audition_id = ? AND applicant_id = ?", audition, applicant));
        assertEquals(1, feeRows(applicant, audition));
        assertEquals(4L, balance(applicant));
        assertLedgerMatchesWallet(applicant);
    }

    /** 2) 같은 사용자·오디션 중복 차감 불가 (서비스 직접 호출) + 4) 실패 시 잔액·원장 함께 롤백 */
    @Test
    void secondFeeForSameAuditionFailsAndRollsBackWalletAndLedger() {
        UUID applicant = user("APPLICANT");
        UUID audition = audition();
        credits.grantCredits(applicant, 5, "PROMOTION", null, null, "it");

        credits.useCredits(applicant, CreditPolicyKey.AUDITION_APPLY, audition.toString());
        assertThrows(DataIntegrityViolationException.class,
                () -> credits.useCredits(applicant, CreditPolicyKey.AUDITION_APPLY, audition.toString()));

        assertEquals(1, feeRows(applicant, audition));
        assertEquals(4L, balance(applicant), "wallet decrement must roll back together with the rejected ledger row");
        assertLedgerMatchesWallet(applicant);
    }

    /** 4) 잔액 부족 실패 시 지원서·원장·잔액 모두 롤백, 이후 재시도는 1회만 차감 */
    @Test
    void insufficientCreditsLeavesNoApplicationNoLedgerAndRetrySucceedsOnce() {
        UUID applicant = user("APPLICANT");
        UUID audition = audition();
        asUser(applicant);

        assertThrows(InsufficientCreditsException.class, () -> applications.submitApplication(request(audition)));
        assertEquals(0, count("SELECT COUNT(*) FROM applications WHERE audition_id = ? AND applicant_id = ?", audition, applicant));
        assertEquals(0, feeRows(applicant, audition));
        assertEquals(0L, balance(applicant));

        credits.grantCredits(applicant, 1, "PROMOTION", null, null, "it");
        applications.submitApplication(request(audition));
        assertThrows(ResponseStatusException.class, () -> applications.submitApplication(request(audition)));
        assertEquals(1, feeRows(applicant, audition));
        assertEquals(0L, balance(applicant));
        assertLedgerMatchesWallet(applicant);
    }

    /** 5) 지급·충전·차감·관리자 조정 후 원장 합계 == 잔액, 마지막 after_balance == 잔액 */
    @Test
    void grantChargeUseAndAdminAdjustKeepLedgerSumEqualToBalance() {
        UUID applicant = user("APPLICANT");
        UUID admin = user("ADMIN");
        credits.grantCredits(applicant, 7, "EVENT_REWARD", null, admin, "it");
        credits.applyAdminBalanceDelta(applicant, 3, admin, "it plus");
        credits.applyAdminBalanceDelta(applicant, -2, admin, "it minus");
        asUser(applicant);
        applications.submitApplication(request(audition()));
        applications.submitApplication(request(audition()));

        assertEquals(6L, balance(applicant));
        assertLedgerMatchesWallet(applicant);
        Long last = jdbc.queryForObject("""
                SELECT after_balance FROM credit_transactions WHERE user_id = ?
                ORDER BY created_at DESC, id DESC LIMIT 1
                """, Long.class, applicant);
        assertEquals(6L, last);
        Integer chainBreaks = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND before_balance + amount <> after_balance
                """, Integer.class, applicant);
        assertEquals(0, chainBreaks);
    }

    /** 6) DB UNIQUE 인덱스(ux_credit_tx_apply_fee)가 직접 INSERT 중복을 최종 거부 */
    @Test
    void uniqueIndexRejectsDirectDuplicateFeeInsert() {
        UUID applicant = user("APPLICANT");
        String ref = audition().toString();
        String sql = """
                INSERT INTO credit_transactions (id, user_id, amount, type, reason, reference_id, before_balance, after_balance)
                VALUES (?, ?, -1, 'USE', 'AUDITION_APPLY', ?, 1, 0)
                """;
        jdbc.update(sql, UUID.randomUUID(), applicant, ref);
        DataIntegrityViolationException ex = assertThrows(DataIntegrityViolationException.class,
                () -> jdbc.update(sql, UUID.randomUUID(), applicant, ref));
        assertTrue(ex.getMessage().contains("ux_credit_tx_apply_fee"), ex.getMessage());
        Integer indexes = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE indexname IN ('ux_credit_tx_apply_fee','ux_credit_tx_signup_reward','ux_credit_tx_package_purchase')",
                Integer.class);
        assertEquals(3, indexes);
    }

    /** 7) 동시 요청: 같은 오디션 8 스레드 → 1건만 성공·1회만 차감 / 서로 다른 오디션 병렬 → 잔액 손실 없음 */
    @Test
    void concurrentSubmitsChargeExactlyOnce() throws Exception {
        UUID applicant = user("APPLICANT");
        UUID audition = audition();
        credits.grantCredits(applicant, 5, "PROMOTION", null, null, "it");

        List<Object> outcomes = race(8, i -> audition, applicant);
        long ok = outcomes.stream().filter(o -> o == null).count();
        assertEquals(1, ok, "exactly one concurrent submit may succeed: " + outcomes);
        for (Object o : outcomes) {
            if (o != null) {
                assertTrue(o instanceof ResponseStatusException rse && rse.getStatusCode().value() == 409
                        || o instanceof DataIntegrityViolationException, "unexpected failure: " + o);
            }
        }
        assertEquals(1, feeRows(applicant, audition));
        assertEquals(1, count("SELECT COUNT(*) FROM applications WHERE audition_id = ? AND applicant_id = ?", audition, applicant));
        assertEquals(4L, balance(applicant));

        List<UUID> distinct = List.of(audition(), audition(), audition(), audition());
        List<Object> parallel = race(4, distinct::get, applicant);
        assertTrue(parallel.stream().allMatch(o -> o == null), "distinct auditions must all succeed: " + parallel);
        assertEquals(0L, balance(applicant), "wallet row lock must prevent lost updates");
        assertLedgerMatchesWallet(applicant);
    }

    private interface AuditionPicker {
        UUID pick(int i);
    }

    private List<Object> race(int n, AuditionPicker picker, UUID applicant) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                UUID target = picker.pick(i);
                Callable<Object> task = () -> {
                    asUser(applicant);
                    start.await();
                    try {
                        applications.submitApplication(request(target));
                        return null;
                    } catch (Exception e) {
                        return e;
                    } finally {
                        SecurityContextHolder.clearContext();
                    }
                };
                futures.add(pool.submit(task));
            }
            start.countDown();
            List<Object> out = new ArrayList<>();
            for (Future<Object> f : futures) {
                out.add(f.get(60, TimeUnit.SECONDS));
            }
            return out;
        } finally {
            pool.shutdownNow();
        }
    }

    private void assertLedgerMatchesWallet(UUID userId) {
        Long sum = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE user_id = ?", Long.class, userId);
        assertEquals(balance(userId), sum, "ledger sum must equal wallet balance");
    }

    private long balance(UUID userId) {
        List<Long> rows = jdbc.queryForList("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, userId);
        return rows.isEmpty() ? 0L : rows.get(0);
    }

    private int feeRows(UUID userId, UUID audition) {
        return count("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'USE' AND reason = 'AUDITION_APPLY' AND reference_id = ?
                """, userId, audition.toString());
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    private UUID audition() {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, location, process_mode, group_id)
                VALUES (?, ?, 'credit integrity IT', 'IT fixture', 'OPEN', 'KR', 'Seoul', 'SINGLE', ?)
                """, id, owner, id);
        auditions.add(id);
        return id;
    }

    private UUID user(String role) {
        UUID id = UUID.randomUUID();
        String handle = "ci" + id.toString().replace("-", "").substring(0, 10);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, 'KR')
                """, id, handle + DOMAIN, role, handle, handle, handle);
        return id;
    }

    private static CreateApplicationRequest request(UUID audition) {
        CreateApplicationRequest r = new CreateApplicationRequest();
        r.setAuditionId(audition);
        r.setName("Credit IT");
        r.setNationality("KR");
        r.setVideoUrl(VIDEO);
        return r;
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, "n/a", List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"))));
    }
}
