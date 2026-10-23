package com.audition.platform.application.payment;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.org.JdbcCreditLotStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@TestPropertySource(properties = {
        "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5432/audition_engine_test}",
        "spring.datasource.username=${TEST_DB_USER:postgres}",
        "spring.datasource.password=${TEST_DB_PASSWORD:postgres}",
        "audition.voting-db-verify=false",
        "app.translation.queue.enabled=false",
        "app.super-admin.bootstrap-enabled=false",
})
class PaymentStabilizationIT {

    private static final UUID TOKYO = UUID.fromString("e5533082-7866-4112-9e44-39db846ed14a");
    private static final UUID JP_CONTRACT = UUID.fromString("a0495a80-800b-4989-823f-fb9123732bf7");
    private static final String SECRET = "unit-test-secret-not-a-provider-key";
    private static final String ROTATED = "unit-test-secret-rotated-marker";
    private static final String LIVE_SECRET = "unit-test-live-slot-marker-zzzz";
    private static final String WEBHOOK = "unit-test-webhook-marker-bbbb";
    private static final String CLIENT = "public-client-marker";

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PaymentService payments;
    @Autowired
    private SettingsSecretCrypto crypto;
    @Autowired
    private CreditService credits;
    @Autowired
    private ApplicationSubmitService applications;
    @Autowired
    private JdbcCreditLotStore lots;

    private SecretSnapshot mockTest;
    private SecretSnapshot mockLive;
    private boolean mockTestExisted;
    private boolean mockLiveExisted;
    private String tossConnection;
    private String tossContract;
    private String paypalConnection;
    private String paypalContract;
    private final List<UUID> auditIds = new ArrayList<>();

    @BeforeEach
    void snapshotSecrets() {
        mockTestExisted = secretExists("TEST");
        mockLiveExisted = secretExists("LIVE");
        mockTest = readSecret("TEST");
        mockLive = readSecret("LIVE");
        tossConnection = providerState("TOSS_DOMESTIC", "connection_status");
        tossContract = providerState("TOSS_DOMESTIC", "contract_status");
        paypalConnection = providerState("PAYPAL", "connection_status");
        paypalContract = providerState("PAYPAL", "contract_status");
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        restoreSecret("TEST", mockTestExisted, mockTest);
        restoreSecret("LIVE", mockLiveExisted, mockLive);
        jdbc.update(
                "UPDATE payment_provider_configs SET connection_status = ?, contract_status = ? WHERE id = 'TOSS_DOMESTIC'",
                tossConnection, tossContract);
        jdbc.update(
                "UPDATE payment_provider_configs SET connection_status = ?, contract_status = ? WHERE id = 'PAYPAL'",
                paypalConnection, paypalContract);
        if (!auditIds.isEmpty()) {
            jdbc.update("DELETE FROM admin_logs WHERE id IN (" + auditIds.stream().map(id -> "?").reduce((a, b) -> a + "," + b).orElse("?") + ")",
                    auditIds.toArray());
            auditIds.clear();
        }
        jdbc.update("""
                DELETE FROM admin_logs
                WHERE action = 'PAYMENT_SETTINGS_PATCH'
                  AND (
                    target_id IN (SELECT order_no FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test'))
                    OR payload::text LIKE '%@pay.flow.test%'
                  )
                """);
        jdbc.update("""
                DELETE FROM revenue_attributions
                WHERE credit_transaction_id IN (
                    SELECT id FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test')
                )
                """);
        jdbc.update("DELETE FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test')");
        jdbc.update("UPDATE auditions SET applicants_count = (SELECT COUNT(*) FROM applications WHERE audition_id = auditions.id) WHERE id = ?", TOKYO);
        jdbc.update("DELETE FROM payment_refunds WHERE order_id IN (SELECT id FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test'))");
        jdbc.update("DELETE FROM payment_webhook_logs WHERE order_no IN (SELECT order_no FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test'))");
        jdbc.update("DELETE FROM payment_error_logs WHERE order_no IN (SELECT order_no FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test'))");
        jdbc.update("DELETE FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test')");
        jdbc.update("DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test')");
        jdbc.update("DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pay.flow.test')");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@pay.flow.test'");
        jdbc.update("DELETE FROM credit_packages WHERE name LIKE 'pay-flow-%'");
        jdbc.update("DELETE FROM payment_fx_rates WHERE basis = 'PAY_FLOW_TEST'");
        lots.rebuild();
    }

    @Test
    void secretsStayMaskedSeparatedAndOutOfLogs() {
        UUID hq = hq();
        UUID applicant = jdbc.queryForObject(
                "SELECT id FROM users WHERE role = 'APPLICANT' ORDER BY created_at LIMIT 1", UUID.class);
        ListAppender<ILoggingEvent> paymentLog = attach(PaymentService.class);
        ListAppender<ILoggingEvent> cryptoLog = attach(SettingsSecretCrypto.class);
        ListAppender<ILoggingEvent> tossLog = attach(TossPaymentsClient.class);
        try {
            asUser(applicant, "APPLICANT");
            assertStatus(403, () -> payments.rotateSecret("MOCK", "TEST", CLIENT, null, SECRET, null, WEBHOOK));
            assertStatus(403, () -> payments.credentialView("MOCK", "TEST"));
            assertStatus(403, () -> payments.searchOrders(null, null, null, null, null));
            assertStatus(403, () -> payments.paymentAdminHistory());

            asUser(hq, "SUPER_ADMIN");
            Map<String, Object> saved = payments.rotateSecret("MOCK", "TEST", CLIENT, "client-id-marker", SECRET, "merchant-marker", WEBHOOK);
            remember("MOCK");
            assertEquals("****-key", saved.get("secretLast4"));
            assertEquals("****bbbb", saved.get("webhookLast4"));
            assertFalse(String.valueOf(saved).contains(SECRET));
            assertFalse(String.valueOf(saved).contains(WEBHOOK));

            Map<String, Object> live = payments.rotateSecret("MOCK", "LIVE", CLIENT, null, LIVE_SECRET, null, null);
            remember("MOCK");
            assertEquals("****zzzz", live.get("secretLast4"));
            assertNotEquals(saved.get("secretLast4"), live.get("secretLast4"));

            Map<String, Object> rotated = payments.rotateSecret("MOCK", "TEST", null, null, ROTATED, null, null);
            remember("MOCK");
            assertEquals("****rker", rotated.get("secretLast4"));
            assertEquals("****bbbb", rotated.get("webhookLast4"));

            String testCipher = jdbc.queryForObject(
                    "SELECT secret_cipher FROM payment_provider_secrets WHERE provider_id = 'MOCK' AND environment = 'TEST'",
                    String.class);
            String liveCipher = jdbc.queryForObject(
                    "SELECT secret_cipher FROM payment_provider_secrets WHERE provider_id = 'MOCK' AND environment = 'LIVE'",
                    String.class);
            assertFalse(testCipher.contains(ROTATED));
            assertFalse(liveCipher.contains(LIVE_SECRET));
            assertNotEquals(testCipher, liveCipher);
            assertEquals(ROTATED, crypto.decrypt(testCipher));
            assertEquals(LIVE_SECRET, crypto.decrypt(liveCipher));
            assertEquals("****rker", payments.credentialView("MOCK", "TEST").get("secretLast4"));
            assertEquals("****zzzz", payments.credentialView("MOCK", "LIVE").get("secretLast4"));

            String payload = jdbc.queryForObject(
                    "SELECT string_agg(payload::text, ' ') FROM admin_logs WHERE id IN ("
                            + auditIds.stream().map(id -> "?").reduce((a, b) -> a + "," + b).orElse("?") + ")",
                    String.class, auditIds.toArray());
            assertFalse(payload.contains(SECRET));
            assertFalse(payload.contains(ROTATED));
            assertFalse(payload.contains(LIVE_SECRET));
            assertFalse(payload.contains(WEBHOOK));
            assertTrue(payload.contains("rotated"));
            assertTrue(payments.paymentAdminHistory().stream().noneMatch(row -> String.valueOf(row).contains(ROTATED)));
            assertTrue(payments.providerViews().stream().noneMatch(row -> String.valueOf(row).contains(ROTATED)));

            assertEquals(0, secretCount("TOSS_DOMESTIC"));
            assertEquals(0, secretCount("PAYPAL"));
            assertEquals("NOT_CONFIGURED", payments.testConnection("TOSS_DOMESTIC").get("result"));
            assertEquals("NOT_CONFIGURED", payments.testConnection("PAYPAL").get("result"));
            assertEquals("CONNECTED", payments.testConnection("MOCK").get("result"));

            String logs = events(paymentLog) + events(cryptoLog) + events(tossLog);
            assertFalse(logs.contains(SECRET));
            assertFalse(logs.contains(ROTATED));
            assertFalse(logs.contains(LIVE_SECRET));
            assertFalse(logs.contains(WEBHOOK));
        } finally {
            detach(PaymentService.class, paymentLog);
            detach(SettingsSecretCrypto.class, cryptoLog);
            detach(TossPaymentsClient.class, tossLog);
        }
    }

    @Test
    void freeCreditIsConsumedBeforePaidMockCredit() {
        UUID hq = hq();
        UUID applicant = user();
        asUser(hq, "SUPER_ADMIN");
        payments.addFx("KRW", new BigDecimal("1300"), "PAY_FLOW_TEST", "HALF_UP", Instant.now().minusSeconds(60));
        remember("FX");
        credits.grantCredits(applicant, 1, "ADMIN_GRANT", "pay-flow-free-" + applicant, hq, "pay-flow free");
        UUID pack = pkg(1);
        asUser(applicant, "APPLICANT");
        Map<String, Object> created = payments.createOrder(applicant, pack, "KR", "MOCK", "MOCK_CARD", "free-first");
        payments.confirm(applicant, (String) created.get("orderNo"), "SUCCESS", 1300L, null);
        Map<String, Object> failed = payments.createOrder(applicant, pack, "KR", "MOCK", "MOCK_CARD", "free-first-fail");
        payments.confirm(applicant, (String) failed.get("orderNo"), "FAIL", 1300L, null);
        long beforeApply = jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, applicant);
        assertEquals(2L, beforeApply);
        assertEquals(0, charges(applicant, (String) failed.get("orderNo")));

        CreateApplicationRequest apply = new CreateApplicationRequest();
        apply.setAuditionId(TOKYO);
        apply.setName("Pay Flow Free");
        apply.setNationality("KR");
        apply.setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        applications.submitApplication(apply);
        UUID useId = jdbc.queryForObject("""
                SELECT id FROM credit_transactions
                WHERE user_id = ? AND type = 'USE' AND reason = 'AUDITION_APPLY'
                ORDER BY created_at DESC LIMIT 1
                """, UUID.class, applicant);
        lots.rebuild();
        assertEquals("FREE_FIRST", jdbc.queryForObject(
                "SELECT allocation_policy FROM settlement_policies WHERE id = 1", String.class));
        List<Map<String, Object>> allocations = jdbc.queryForList("""
                SELECT bucket, status, credits FROM credit_lot_allocations WHERE usage_credit_transaction_id = ?
                """, useId);
        assertEquals(1, allocations.size());
        assertEquals("FREE", allocations.get(0).get("bucket"));
        assertEquals("ALLOCATED", allocations.get(0).get("status"));
        assertEquals(1L, ((Number) allocations.get(0).get("credits")).longValue());
        Long paidRemaining = jdbc.queryForObject("""
                SELECT COALESCE(SUM(remaining_credits), 0) FROM credit_lots WHERE user_id = ? AND bucket = 'PAID'
                """, Long.class, applicant);
        assertEquals(1L, paidRemaining);
        long wallet = jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, applicant);
        long closing = jdbc.queryForObject("""
                SELECT after_balance FROM credit_transactions
                WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
                """, Long.class, applicant);
        assertEquals(1L, wallet);
        assertEquals(wallet, closing);
        Map<String, Object> settlement = jdbc.queryForMap("""
                SELECT COUNT(*) AS n, MIN(compensation_final) AS compensation
                FROM monthly_settlements
                WHERE country_code = 'JP' AND contract_id = ? AND period_key = '2026-10' AND status = 'PAID'
                """, JP_CONTRACT);
        assertEquals(1L, ((Number) settlement.get("n")).longValue());
        assertEquals(0, new BigDecimal("0.20").compareTo((BigDecimal) settlement.get("compensation")));
        BigDecimal fee = jdbc.queryForObject("SELECT amount_usd FROM platform_application_fee WHERE id = 1", BigDecimal.class);
        assertEquals(0, BigDecimal.ONE.compareTo(fee));
    }

    @Test
    void adminDeskSeparatesMockFromLiveAndBlocksLiveRefund() {
        UUID hq = hq();
        UUID applicant = user();
        asUser(hq, "SUPER_ADMIN");
        payments.addFx("KRW", new BigDecimal("1300"), "PAY_FLOW_TEST", "HALF_UP", Instant.now().minusSeconds(30));
        remember("FX");
        UUID one = pkg(1);
        UUID two = pkg(2);
        Map<String, Object> success = payments.runAdminMockTest(applicantEmail(applicant), two, "KR", "SUCCESS");
        assertEquals(1, ((Number) success.get("chargeCount")).intValue());
        assertEquals(success.get("walletBalance"), success.get("ledgerClosing"));
        String paidNo = (String) success.get("orderNo");
        List<PaymentCatalogStore.OrderAdminRow> found = payments.searchOrders(applicantEmail(applicant), "MOCK", "PAID", null, null);
        assertTrue(found.stream().anyMatch(row -> paidNo.equals(row.orderNo())));
        Map<String, Object> detail = payments.orderDetail(paidNo);
        assertEquals(false, detail.get("liveRefundAllowed"));
        assertEquals(2600L, ((Number) detail.get("refundableMinor")).longValue());

        long balance = ((Number) success.get("walletBalance")).longValue();
        Map<String, Object> failed = payments.runAdminMockTest(applicantEmail(applicant), one, "KR", "FAIL");
        assertEquals(0, ((Number) failed.get("chargeCount")).intValue());
        assertEquals("FAILED", failed.get("status"));
        assertEquals(balance, jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, applicant));
        Map<String, Object> cancelled = payments.runAdminMockTest(applicantEmail(applicant), one, "KR", "CANCEL");
        assertEquals("CANCELLED", cancelled.get("status"));
        assertEquals(0, ((Number) cancelled.get("chargeCount")).intValue());

        Map<String, Object> network = payments.runAdminMockTest(applicantEmail(applicant), one, "KR", "NETWORK");
        assertEquals("READY", network.get("status"));
        assertEquals(0, ((Number) network.get("chargeCount")).intValue());
        UUID errorId = jdbc.queryForObject("""
                SELECT id FROM payment_error_logs WHERE order_no = ? AND code = 'NETWORK_ERROR' ORDER BY created_at DESC LIMIT 1
                """, UUID.class, network.get("orderNo"));
        payments.reprocessError(errorId, "SUCCESS");
        assertEquals(1, charges(applicant, (String) network.get("orderNo")));
        assertEquals("REPROCESSED", jdbc.queryForObject(
                "SELECT process_status FROM payment_error_logs WHERE id = ?", String.class, errorId));
        UUID failError = jdbc.queryForObject("""
                SELECT id FROM payment_error_logs WHERE order_no = ? AND retryable = FALSE ORDER BY created_at DESC LIMIT 1
                """, UUID.class, failed.get("orderNo"));
        assertStatus(409, () -> payments.reprocessError(failError, "SUCCESS"));

        payments.refund(hq, paidNo, 1300L, "desk-partial", true);
        payments.refund(hq, paidNo, 1300L, "desk-partial", true);
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_refunds WHERE idempotency_key = 'desk-partial'", Integer.class));
        assertTrue(payments.refunds().stream().anyMatch(row -> paidNo.equals(row.orderNo()) && row.amountMinor() == 1300L));
        assertTrue(payments.paymentAdminHistory().stream().anyMatch(row -> String.valueOf(row.get("summary")).contains("refund=true")));
        long afterRefund = jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, applicant);
        long closing = jdbc.queryForObject("""
                SELECT after_balance FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
                """, Long.class, applicant);
        assertEquals(closing, afterRefund);

        String liveNo = "ORD-LIVE-" + applicant.toString().substring(0, 8);
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits,
                    environment, payment_country, charge_currency, charge_amount_minor, credits_issued,
                    provider_config_id, method_code, idempotency_key
                ) VALUES (?, ?, ?, ?, 'MOCK', 1, 'USD', 'PAID', 1, 0, 'LIVE', 'KR', 'KRW', 1300, 1, 'MOCK', 'MOCK_CARD', ?)
                """, UUID.randomUUID(), liveNo, applicant, one, "live-paid-" + applicant);
        assertStatus(403, () -> payments.refund(hq, liveNo, 1300L, "live-blocked", true));
        assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_refunds r JOIN payment_orders o ON o.id = r.order_id WHERE o.order_no = ?",
                Integer.class, liveNo));

        String readyNo = "ORD-LIVEREADY-" + applicant.toString().substring(0, 8);
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits,
                    environment, payment_country, charge_currency, charge_amount_minor, credits_issued,
                    provider_config_id, method_code, idempotency_key
                ) VALUES (?, ?, ?, ?, 'MOCK', 1, 'USD', 'READY', 1, 0, 'LIVE', 'KR', 'KRW', 1300, 1, 'MOCK', 'MOCK_CARD', ?)
                """, UUID.randomUUID(), readyNo, applicant, one, "live-ready-" + applicant);
        UUID liveError = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_error_logs (id, order_no, provider_id, code, message, retryable, process_status)
                VALUES (?, ?, 'MOCK', 'NETWORK_ERROR', 'NETWORK_ERROR', TRUE, 'OPEN')
                """, liveError, readyNo);
        assertStatus(403, () -> payments.reprocessError(liveError, "SUCCESS"));
        assertEquals("BLOCKED", jdbc.queryForObject(
                "SELECT process_status FROM payment_error_logs WHERE id = ?", String.class, liveError));
        assertEquals(0, charges(applicant, readyNo));

        String testNo = "ORD-TEST-" + applicant.toString().substring(0, 8);
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits,
                    environment, payment_country, charge_currency, charge_amount_minor, credits_issued,
                    provider_config_id, method_code, idempotency_key
                ) VALUES (?, ?, ?, ?, 'MOCK', 1, 'USD', 'READY', 1, 0, 'TEST', 'KR', 'KRW', 1300, 1, 'MOCK', 'MOCK_CARD', ?)
                """, UUID.randomUUID(), testNo, applicant, one, "test-ready-" + applicant);
        UUID testError = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_error_logs (id, order_no, provider_id, code, message, retryable, process_status)
                VALUES (?, ?, 'MOCK', 'NETWORK_ERROR', 'NETWORK_ERROR', TRUE, 'OPEN')
                """, testError, testNo);
        assertStatus(409, () -> payments.reprocessError(testError, "SUCCESS"));
        assertEquals(0, charges(applicant, testNo));
        assertTrue(payments.searchOrders(null, "LIVE", null, Instant.now().minusSeconds(3600), Instant.now().plusSeconds(60))
                .stream().anyMatch(row -> liveNo.equals(row.orderNo())));
        assertTrue(payments.webhooks().stream().noneMatch(row -> row.orderNo() != null && row.orderNo().contains(applicant.toString())));
    }

    private void remember(String targetId) {
        UUID id = jdbc.queryForObject("""
                SELECT id FROM admin_logs
                WHERE action = 'PAYMENT_SETTINGS_PATCH' AND target_id = ?
                ORDER BY created_at DESC LIMIT 1
                """, UUID.class, targetId);
        auditIds.add(id);
    }

    private int secretCount(String providerId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_provider_secrets WHERE provider_id = ? AND secret_cipher IS NOT NULL",
                Integer.class, providerId);
        return count == null ? 0 : count;
    }

    private boolean secretExists(String environment) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM payment_provider_secrets WHERE provider_id = 'MOCK' AND environment = ?",
                Integer.class, environment);
        return count != null && count > 0;
    }

    private SecretSnapshot readSecret(String environment) {
        List<SecretSnapshot> rows = jdbc.query("""
                SELECT client_key, client_id, secret_cipher, merchant_id, webhook_secret_cipher
                FROM payment_provider_secrets WHERE provider_id = 'MOCK' AND environment = ?
                """, (rs, n) -> new SecretSnapshot(
                rs.getString("client_key"),
                rs.getString("client_id"),
                rs.getString("secret_cipher"),
                rs.getString("merchant_id"),
                rs.getString("webhook_secret_cipher")), environment);
        return rows.stream().findFirst().orElse(null);
    }

    private void restoreSecret(String environment, boolean existed, SecretSnapshot snapshot) {
        if (!existed) {
            jdbc.update("DELETE FROM payment_provider_secrets WHERE provider_id = 'MOCK' AND environment = ?", environment);
            return;
        }
        jdbc.update("""
                UPDATE payment_provider_secrets
                SET client_key = ?, client_id = ?, secret_cipher = ?, merchant_id = ?, webhook_secret_cipher = ?
                WHERE provider_id = 'MOCK' AND environment = ?
                """, snapshot.clientKey, snapshot.clientId, snapshot.secretCipher, snapshot.merchantId, snapshot.webhookCipher, environment);
    }

    private String providerState(String id, String column) {
        return jdbc.queryForObject("SELECT " + column + " FROM payment_provider_configs WHERE id = ?", String.class, id);
    }

    private int charges(UUID userId, String orderNo) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'CHARGE' AND reference_id = ?
                """, Integer.class, userId, orderNo);
        return count == null ? 0 : count;
    }

    private String applicantEmail(UUID id) {
        return jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, id);
    }

    private UUID pkg(int credits) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO credit_packages (id, name, price, credits, bonus_credits, active, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, TRUE, 0, NOW(), NOW())
                """, id, "pay-flow-" + credits + "-" + id.toString().substring(0, 8), credits, credits);
        return id;
    }

    private UUID user() {
        UUID id = UUID.randomUUID();
        String handle = "pay" + id.toString().replace("-", "").substring(0, 8);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', 'APPLICANT', ?, ?, ?, 'KR')
                """, id, handle + "@pay.flow.test", handle, handle, handle);
        return id;
    }

    private UUID hq() {
        return jdbc.queryForObject(
                "SELECT id FROM users WHERE role = 'SUPER_ADMIN' ORDER BY created_at LIMIT 1", UUID.class);
    }

    private static void asUser(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, "n/a", List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private static void assertStatus(int status, org.junit.jupiter.api.function.Executable call) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, call);
        assertEquals(status, ex.getStatusCode().value());
    }

    private static ListAppender<ILoggingEvent> attach(Class<?> type) {
        Logger logger = (Logger) LoggerFactory.getLogger(type);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        return appender;
    }

    private static void detach(Class<?> type, ListAppender<ILoggingEvent> appender) {
        Logger logger = (Logger) LoggerFactory.getLogger(type);
        logger.detachAppender(appender);
    }

    private static String events(ListAppender<ILoggingEvent> appender) {
        StringBuilder builder = new StringBuilder();
        for (ILoggingEvent event : appender.list) {
            builder.append(event.getFormattedMessage()).append('\n');
        }
        return builder.toString();
    }

    private record SecretSnapshot(
            String clientKey, String clientId, String secretCipher, String merchantId, String webhookCipher) {
    }
}
