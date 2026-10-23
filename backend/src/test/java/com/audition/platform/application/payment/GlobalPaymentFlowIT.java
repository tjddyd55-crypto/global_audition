package com.audition.platform.application.payment;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.application.org.AttributionService;
import com.audition.platform.application.org.JdbcCreditLotStore;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
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
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
class GlobalPaymentFlowIT {

    private static final UUID TOKYO = UUID.fromString("e5533082-7866-4112-9e44-39db846ed14a");
    private static final UUID JP_CONTRACT = UUID.fromString("a0495a80-800b-4989-823f-fb9123732bf7");

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PaymentService payments;
    @Autowired
    private TestRevenuePreviewService preview;
    @Autowired
    private ApplicationSubmitService applications;
    @Autowired
    private AttributionService attribution;
    @Autowired
    private JdbcCreditLotStore lots;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
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
    void mockKrwTopUpRefundWebhookAndJpShareStayOutOfLivePayout() {
        UUID hq = jdbc.queryForObject("SELECT id FROM users WHERE role = 'SUPER_ADMIN' ORDER BY created_at LIMIT 1", UUID.class);
        UUID jpAdmin = jdbc.queryForObject(
                "SELECT id FROM users WHERE role = 'COUNTRY_ADMIN' AND email LIKE 'jp-rep2%' LIMIT 1", UUID.class);
        asUser(hq, "SUPER_ADMIN");
        assertEquals("CONNECTED", payments.testConnection("MOCK").get("result"));
        assertEquals("NOT_CONFIGURED", payments.testConnection("TOSS_DOMESTIC").get("result"));
        assertEquals("NOT_CONFIGURED", payments.testConnection("PAYPAL").get("result"));
        assertThrows(ResponseStatusException.class, () -> payments.updateProvider("TOSS_INTERNATIONAL", "LIVE", "LIVE_READY", true));
        assertThrows(ResponseStatusException.class, () -> payments.updateProvider("STRIPE", null, null, true));

        UUID applicant = user();
        asUser(applicant, "APPLICANT");
        ResponseStatusException denied = assertThrows(ResponseStatusException.class, payments::providerViews);
        assertEquals(403, denied.getStatusCode().value());

        UUID one = pkg(1);
        UUID two = pkg(2);
        asUser(hq, "SUPER_ADMIN");
        payments.addFx("KRW", new BigDecimal("1300"), "PAY_FLOW_TEST", "HALF_UP", Instant.now().minusSeconds(60));
        asUser(applicant, "APPLICANT");
        List<Map<String, Object>> methods = payments.availableMethods("KR");
        assertTrue(methods.stream().anyMatch(row -> "MOCK".equals(row.get("providerId"))));
        assertTrue(methods.stream().noneMatch(row -> "STRIPE".equals(row.get("providerId")) || "TOSS_DOMESTIC".equals(row.get("providerId"))));

        Map<String, Object> quote = payments.quote(one, "KR", "MOCK", "MOCK_CARD");
        assertEquals(1300L, ((Number) quote.get("chargeAmountMinor")).longValue());
        assertEquals(1L, ((Number) quote.get("credits")).longValue());

        Map<String, Object> first = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-1");
        Map<String, Object> again = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-1");
        assertEquals(first.get("orderNo"), again.get("orderNo"));
        String order1 = (String) first.get("orderNo");
        payments.confirm(applicant, order1, "SUCCESS", 1300L, null);
        payments.confirm(applicant, order1, "SUCCESS", 1300L, null);
        assertEquals(1, charges(applicant, order1));

        Map<String, Object> second = payments.createOrder(applicant, two, "KR", "MOCK", "MOCK_CARD", "idem-2");
        String order2 = (String) second.get("orderNo");
        assertEquals(2600L, ((Number) second.get("chargeAmountMinor")).longValue());
        payments.confirm(applicant, order2, "SUCCESS", 2600L, null);

        Map<String, Object> failed = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-fail");
        payments.confirm(applicant, (String) failed.get("orderNo"), "FAIL", 1300L, null);
        assertEquals(0, charges(applicant, (String) failed.get("orderNo")));
        assertEquals("FAILED", payments.myOrder(applicant, (String) failed.get("orderNo")).get("status"));

        Map<String, Object> cancelled = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-cancel");
        payments.cancel(applicant, (String) cancelled.get("orderNo"));
        assertEquals("CANCELLED", payments.myOrder(applicant, (String) cancelled.get("orderNo")).get("status"));
        assertEquals(0, charges(applicant, (String) cancelled.get("orderNo")));

        ResponseStatusException mismatch = assertThrows(ResponseStatusException.class,
                () -> payments.confirm(applicant, (String) payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-mismatch").get("orderNo"),
                        "SUCCESS", 1L, null));
        assertEquals(400, mismatch.getStatusCode().value());

        Map<String, Object> retry = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-retry");
        String retryNo = (String) retry.get("orderNo");
        ResponseStatusException network = assertThrows(ResponseStatusException.class,
                () -> payments.confirm(applicant, retryNo, "NETWORK", 1300L, null));
        assertEquals(502, network.getStatusCode().value());
        assertEquals("READY", payments.myOrder(applicant, retryNo).get("status"));
        payments.confirm(applicant, retryNo, "SUCCESS", 1300L, null);
        assertEquals(1, charges(applicant, retryNo));

        Map<String, Object> hooked = payments.createOrder(applicant, one, "KR", "MOCK", "MOCK_CARD", "idem-hook");
        String hookNo = (String) hooked.get("orderNo");
        String secret = payments.mockWebhookSecretForTest("MOCK");
        String body = "{\"eventId\":\"evt-pay-flow\",\"orderNo\":\"" + hookNo + "\",\"type\":\"PAYMENT_SUCCESS\"}";
        String signature = com.audition.platform.application.payment.gateway.MockPaymentAdapter.sign(body, secret);
        assertEquals("PAID", payments.receiveWebhook("MOCK", body, signature).get("status"));
        assertEquals("DUPLICATE", payments.receiveWebhook("MOCK", body, signature).get("status"));
        assertEquals(1, charges(applicant, hookNo));
        assertThrows(ResponseStatusException.class, () -> payments.receiveWebhook("MOCK", body, "bad-signature"));

        CreateApplicationRequest apply = new CreateApplicationRequest();
        apply.setAuditionId(TOKYO);
        apply.setName("Pay Flow");
        apply.setNationality("KR");
        apply.setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        applications.submitApplication(apply);
        UUID useId = jdbc.queryForObject("""
                SELECT id FROM credit_transactions
                WHERE user_id = ? AND type = 'USE' AND reason = 'AUDITION_APPLY'
                ORDER BY created_at DESC LIMIT 1
                """, UUID.class, applicant);
        asUser(hq, "SUPER_ADMIN");
        assertTrue(attribution.attributeCreditUse(useId));
        YearMonth month = YearMonth.now(ZoneOffset.UTC);
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Map<String, Object> hqView = preview.preview("JP", JP_CONTRACT, from, to);
        asUser(jpAdmin, "COUNTRY_ADMIN");
        Map<String, Object> jpView = preview.preview("JP", JP_CONTRACT, from, to);
        assertEquals(hqView, jpView);
        assertEquals("TEST", hqView.get("label"));
        assertEquals(Boolean.TRUE, hqView.get("excludedFromLivePayout"));
        assertEquals(1L, ((Number) hqView.get("targetUsd")).longValue());
        assertEquals(2000, ((Number) hqView.get("rateBps")).intValue());
        assertEquals("0.20", hqView.get("compensation"));
        UUID attributionId = jdbc.queryForObject(
                "SELECT id FROM revenue_attributions WHERE credit_transaction_id = ?", UUID.class, useId);
        assertTrue(lots.usages(JP_CONTRACT, from, to).stream()
                .filter(row -> attributionId.equals(row.attributionId()))
                .allMatch(row -> row.payableUsd() == null || row.payableUsd() == 0));

        asUser(applicant, "APPLICANT");
        payments.refund(applicant, order2, 1300, "partial-1", false);
        payments.refund(applicant, order2, 1300, "partial-1", false);
        payments.refund(applicant, order2, 1300, "rest-1", false);
        long wallet = jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, applicant);
        long closing = jdbc.queryForObject("""
                SELECT after_balance FROM credit_transactions
                WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1
                """, Long.class, applicant);
        assertEquals(closing, wallet);
        Integer liveSettlements = jdbc.queryForObject("""
                SELECT COUNT(*) FROM monthly_settlements
                WHERE country_code = 'JP' AND contract_id = ? AND period_key = '2026-10' AND status = 'PAID'
                """, Integer.class, JP_CONTRACT);
        assertEquals(1, liveSettlements);
    }

    private int charges(UUID userId, String orderNo) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM credit_transactions
                WHERE user_id = ? AND type = 'CHARGE' AND reference_id = ?
                """, Integer.class, userId, orderNo);
        return count == null ? 0 : count;
    }

    private UUID pkg(int credits) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO credit_packages (id, name, price, credits, bonus_credits, active, sort_order, created_at, updated_at)
                VALUES (?, ?, ?, ?, 0, TRUE, 0, NOW(), NOW())
                """, id, "pay-flow-" + credits, credits, credits);
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

    private static void asUser(UUID id, String role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, "n/a", List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }
}
