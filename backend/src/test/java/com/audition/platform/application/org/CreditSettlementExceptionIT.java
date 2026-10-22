package com.audition.platform.application.org;

import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.applications.ApplicationSubmitService;
import com.audition.platform.application.credit.CreditGrantReason;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.org.ContractService.ContractView;
import com.audition.platform.application.org.ContractService.Draft;
import com.audition.platform.application.org.CrmService.AgencyDraft;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import com.audition.platform.application.org.SettlementService.SettlementView;
import com.audition.platform.application.payment.PaymentOrderService;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
        "app.jwt.secret=change-me-in-production-min-32-chars"
})
class CreditSettlementExceptionIT {

    private static final String COUNTRY = "ZX";

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ApplicationSubmitService applications;
    @Autowired
    private CreditService credits;
    @Autowired
    private PaymentOrderService payments;
    @Autowired
    private PaymentOrderRepository paymentOrders;
    @Autowired
    private CountryOrgService countries;
    @Autowired
    private CrmService crm;
    @Autowired
    private ContractService contracts;
    @Autowired
    private AttributionService attributions;
    @Autowired
    private SettlementService settlements;
    @Autowired
    private CountryWorkspaceService workspace;

    private long originalFee;

    @BeforeEach
    void rememberFee() {
        originalFee = jdbc.queryForObject("SELECT amount_usd FROM platform_application_fee WHERE id = 1", Long.class);
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("UPDATE platform_application_fee SET amount_usd = ? WHERE id = 1", originalFee);
        jdbc.update("DELETE FROM payout_fx_audit WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM payout_fx_records WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM settlement_adjustments WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM settlement_lines WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM monthly_settlements WHERE country_code = ?", COUNTRY);
        jdbc.update("""
                DELETE FROM revenue_attributions
                WHERE trim(attributed_country) = ?
                   OR credit_transaction_id IN (SELECT id FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test'))
                   OR payment_order_id IN (SELECT id FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test'))
                """, COUNTRY);
        jdbc.update("DELETE FROM contract_documents WHERE contract_id IN (SELECT id FROM contracts WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM contract_versions WHERE contract_id IN (SELECT id FROM contracts WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM contracts WHERE country_code = ?", COUNTRY);
        jdbc.update("DELETE FROM crm_activities WHERE country_code = ?", COUNTRY);
        jdbc.update("DELETE FROM crm_approval_events WHERE crm_agency_id IN (SELECT id FROM crm_agencies WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM crm_stage_events WHERE crm_agency_id IN (SELECT id FROM crm_agencies WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM application_sns_links WHERE application_id IN (SELECT id FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test'))");
        jdbc.update("DELETE FROM application_videos WHERE application_id IN (SELECT id FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test'))");
        jdbc.update("DELETE FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test')");
        jdbc.update("DELETE FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test') OR posting_branch_id IN (SELECT id FROM crm_agencies WHERE country_code = ?)", COUNTRY);
        jdbc.update("DELETE FROM crm_agencies WHERE country_code = ?", COUNTRY);
        jdbc.update("DELETE FROM country_admin_appointments WHERE country_code = ?", COUNTRY);
        jdbc.update("DELETE FROM country_org_audit WHERE country_code = ?", COUNTRY);
        jdbc.update("DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test')");
        jdbc.update("DELETE FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test')");
        jdbc.update("DELETE FROM credit_packages WHERE name LIKE 'qa-ex-%'");
        jdbc.update("DELETE FROM user_credits WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@qa.ex.test')");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@qa.ex.test'");
        jdbc.update("DELETE FROM countries WHERE code = ?", COUNTRY);
    }

    @Test
    void concurrentApplyDeductsOnceAndKeepsOneApplication() throws Exception {
        setFee(3);
        UUID applicant = insertUser("APPLICANT");
        UUID owner = insertUser("AGENCY");
        UUID audition = insertAudition(owner, null, "SINGLE");
        asApplicant(applicant);
        credits.grantCredits(applicant, 6, CreditGrantReason.ADMIN_GRANT, "qa-concurrent", applicant, "qa");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CyclicBarrier barrier = new CyclicBarrier(2);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            results.add(pool.submit(() -> {
                asApplicant(applicant);
                barrier.await(10, TimeUnit.SECONDS);
                try {
                    applications.submitApplication(request(audition, "JP"));
                    return 200;
                } catch (ResponseStatusException ex) {
                    return ex.getStatusCode().value();
                }
            }));
        }
        pool.shutdown();
        assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS));
        List<Integer> codes = List.of(results.get(0).get(), results.get(1).get());
        assertTrue(codes.contains(200), "codes=" + codes);
        assertTrue(codes.contains(409), "codes=" + codes);
        assertEquals(1, count("SELECT COUNT(*) FROM applications WHERE audition_id = '" + audition + "'"));
        assertEquals(1, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = '" + applicant + "' AND type = 'USE'"));
        assertEquals(3L, balance(applicant));
    }

    @Test
    void duplicatePaymentKeyAndReconcileDoNotDoubleCreditOrAttribution() {
        UUID applicant = insertUser("APPLICANT");
        UUID owner = insertUser("AGENCY");
        UUID hq = insertUser("SUPER_ADMIN");
        UUID packageId = insertPackage("qa-ex-dup", 10);
        String orderNo = "QA-EX-" + UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits
                ) VALUES (?, ?, ?, ?, 'TEST', 10, 'USD', 'READY', 10, 0)
                """, UUID.randomUUID(), orderNo, applicant, packageId);
        asApplicant(applicant);
        payments.handleSuccessCallback(orderNo, "dup-1", JsonNodeFactory.instance.objectNode(), applicant);
        payments.handleSuccessCallback(orderNo, "dup-1", JsonNodeFactory.instance.objectNode(), applicant);
        assertEquals(1, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = '" + applicant + "' AND type = 'CHARGE' AND reference_id = '" + orderNo + "'"));
        assertEquals(10L, balance(applicant));

        String tossNo = "QA-EX-TOSS-" + UUID.randomUUID();
        String paymentKey = "toss-key-" + UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits,
                    payment_key, paid_at
                ) VALUES (?, ?, ?, ?, 'TOSS_PAYMENTS', 4, 'USD', 'PAID', 4, 0, ?, ?)
                """, UUID.randomUUID(), tossNo, applicant, packageId, paymentKey,
                Timestamp.from(OffsetDateTime.parse("2026-10-02T00:00:00Z").toInstant()));
        PaymentOrder toss = paymentOrders.findByOrderNo(tossNo).orElseThrow();
        credits.applyChargeFromPaymentOrder(toss);
        credits.applyChargeFromPaymentOrder(toss);
        payments.confirmToss(applicant, paymentKey, tossNo, 4);
        payments.confirmToss(applicant, paymentKey, tossNo, 4);
        assertEquals(1, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = '" + applicant + "' AND type = 'CHARGE' AND reference_id = '" + tossNo + "'"));

        asUser(hq);
        countries.createCountry(COUNTRY, "Exception Home", "USD");
        AgencyRow agency = crm.register(new AgencyDraft(
                COUNTRY, "Dup Agency", "Dup Legal", "BR-DUP", "C", "c@example.com", "0", "https://example.com", null, owner, "n"));
        crm.decide(agency.id(), AgencyApproval.SUBMIT, "접수", null);
        crm.decide(agency.id(), AgencyApproval.RECOMMEND, "요청", null);
        crm.decide(agency.id(), AgencyApproval.HQ_APPROVE, "승인", owner);
        contracts.create(moneyContract(agency.id(), hq, "QA-DUP"));
        UUID audition = insertAudition(owner, agency.id(), "SINGLE");
        asApplicant(applicant);
        setFee(1);
        credits.grantCredits(applicant, 1, CreditGrantReason.ADMIN_GRANT, "qa-dup-fee", applicant, "qa");
        applications.submitApplication(request(audition, "JP"));
        asUser(hq);
        attributions.reconcileApplyUses();
        assertEquals(1, count("SELECT COUNT(*) FROM revenue_attributions WHERE audition_id = '" + audition + "' AND line_kind = 'REVENUE'"));
        attributions.reconcileApplyUses();
        assertEquals(1, count("SELECT COUNT(*) FROM revenue_attributions WHERE audition_id = '" + audition + "' AND line_kind = 'REVENUE'"));
    }

    @Test
    void validationAndMidApplyFailureRollBackApplicationAndCredits() {
        setFee(3);
        UUID applicant = insertUser("APPLICANT");
        UUID owner = insertUser("AGENCY");
        UUID audition = insertAudition(owner, null, "SINGLE");
        asApplicant(applicant);
        credits.grantCredits(applicant, 3, CreditGrantReason.ADMIN_GRANT, "qa-rollback", applicant, "qa");
        ResponseStatusException invalid = assertThrows(ResponseStatusException.class,
                () -> applications.submitApplication(request(audition, "XX")));
        assertEquals(422, invalid.getStatusCode().value());
        assertEquals(0, count("SELECT COUNT(*) FROM applications WHERE applicant_id = '" + applicant + "'"));
        assertEquals(0, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = '" + applicant + "' AND type = 'USE'"));
        assertEquals(3L, balance(applicant));

        jdbc.update("UPDATE auditions SET process_mode = 'MULTI_ROUND' WHERE id = ?", audition);
        ResponseStatusException broken = assertThrows(ResponseStatusException.class,
                () -> applications.submitApplication(request(audition, "JP")));
        assertEquals(500, broken.getStatusCode().value());
        assertEquals(0, count("SELECT COUNT(*) FROM applications WHERE applicant_id = '" + applicant + "'"));
        assertEquals(0, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id = '" + applicant + "' AND type = 'USE'"));
        assertEquals(3L, balance(applicant));
    }

    @Test
    void fullRefundAfterConfirmationWritesAdjustmentAndRejectsDuplicate() {
        setFee(3);
        UUID hq = insertUser("SUPER_ADMIN");
        UUID owner = insertUser("AGENCY");
        UUID applicant = insertUser("APPLICANT");
        asUser(hq);
        countries.createCountry(COUNTRY, "Refund Home", "USD");
        AgencyRow agency = crm.register(new AgencyDraft(
                COUNTRY, "Refund Agency", "Refund Legal", "BR-REF", "C", "c@example.com", "0", "https://example.com", null, owner, "n"));
        crm.decide(agency.id(), AgencyApproval.SUBMIT, "접수", null);
        crm.decide(agency.id(), AgencyApproval.RECOMMEND, "요청", null);
        crm.decide(agency.id(), AgencyApproval.HQ_APPROVE, "승인", owner);
        ContractView contract = contracts.create(moneyContract(agency.id(), hq, "QA-REFUND"));
        UUID packageId = insertPackage("qa-ex-refund", 3);
        UUID paymentId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits, paid_at
                ) VALUES (?, ?, ?, ?, 'TEST', 3, 'USD', 'PAID', 3, 0, ?)
                """, paymentId, "QA-EX-" + paymentId, applicant, packageId,
                Timestamp.from(OffsetDateTime.parse("2026-10-03T00:00:00Z").toInstant()));
        credits.applyChargeFromPaymentOrder(paymentOrders.findById(paymentId).orElseThrow());
        UUID audition = insertAudition(owner, agency.id(), "SINGLE");
        asApplicant(applicant);
        applications.submitApplication(request(audition, "JP"));
        asUser(hq);
        attributions.reconcileApplyUses();
        assertEquals(1, count("SELECT COUNT(*) FROM revenue_attributions WHERE audition_id = '" + audition + "' AND line_kind = 'REVENUE'"));
        attributions.linkCash(paymentId, contract.id());
        SettlementView stored = settlements.calculate(COUNTRY, contract.id(), "2026-10");
        assertEquals("0.60", stored.compensationFinal());
        settlements.submitReview(stored.id());
        settlements.approve(stored.id());
        attributions.recordRefund(paymentId, 3, "full refund of collected cash",
                OffsetDateTime.parse("2026-10-20T00:00:00Z").toInstant());
        SettlementView live = settlements.preview(COUNTRY, contract.id(), "2026-10");
        assertEquals("EXPECTED", live.figureKind());
        assertEquals("0.00", live.compensationFinal());
        SettlementView frozen = settlements.calculate(COUNTRY, contract.id(), "2026-10");
        assertEquals("0.60", frozen.compensationFinal());
        assertEquals("APPROVED", frozen.status());
        SettlementView adjusted = settlements.adjust(stored.id(), "post-confirmation full refund", -3L);
        assertEquals("ADJUSTMENT_REQUIRED", adjusted.status());
        assertEquals("0.60", adjusted.compensationFinal());
        assertEquals(1, count("SELECT COUNT(*) FROM settlement_adjustments WHERE settlement_id = '" + stored.id() + "'"));
        ResponseStatusException duplicate = assertThrows(ResponseStatusException.class,
                () -> attributions.recordRefund(paymentId, 3, "duplicate refund",
                        OffsetDateTime.parse("2026-10-21T00:00:00Z").toInstant()));
        assertEquals(409, duplicate.getStatusCode().value());
        assertEquals("DUPLICATE_REFUND", duplicate.getReason());
        assertEquals(1, count("SELECT COUNT(*) FROM revenue_attributions WHERE payment_order_id = '" + paymentId + "' AND line_kind = 'REFUND'"));
    }

    @Test
    void freeCreditsAreUsedBeforePaidAndExpectedCompensationIsTwentyCents() {
        setFee(3);
        UUID hq = insertUser("SUPER_ADMIN");
        UUID owner = insertUser("AGENCY");
        UUID applicant = insertUser("APPLICANT");
        asUser(hq);
        countries.createCountry(COUNTRY, "Split Home", "USD");
        AgencyRow agency = crm.register(new AgencyDraft(
                COUNTRY, "Split Agency", "Split Legal", "BR-SPLIT", "C", "c@example.com", "0", "https://example.com", null, owner, "n"));
        crm.decide(agency.id(), AgencyApproval.SUBMIT, "접수", null);
        crm.decide(agency.id(), AgencyApproval.RECOMMEND, "요청", null);
        crm.decide(agency.id(), AgencyApproval.HQ_APPROVE, "승인", owner);
        ContractView contract = contracts.create(moneyContract(agency.id(), hq, "QA-SPLIT"));
        credits.grantCredits(applicant, 2, CreditGrantReason.ADMIN_GRANT, "qa-free", hq, "free");
        UUID packageId = insertPackage("qa-ex-paid10", 10);
        UUID paymentId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits, paid_at
                ) VALUES (?, ?, ?, ?, 'TEST', 10, 'USD', 'PAID', 10, 0, ?)
                """, paymentId, "QA-EX-" + paymentId, applicant, packageId,
                Timestamp.from(OffsetDateTime.parse("2026-10-04T00:00:00Z").toInstant()));
        credits.applyChargeFromPaymentOrder(paymentOrders.findById(paymentId).orElseThrow());
        UUID audition = insertAudition(owner, agency.id(), "SINGLE");
        asApplicant(applicant);
        applications.submitApplication(request(audition, "OTHER"));
        asUser(hq);
        attributions.reconcileApplyUses();
        SettlementView october = settlements.calculate(COUNTRY, contract.id(), "2026-10");
        assertEquals(1L, october.targetRevenueUsd());
        assertEquals("0.20", october.compensationFinal());
        assertEquals(2L, bucketCredits(applicant, "FREE"));
        assertEquals(1L, bucketCredits(applicant, "PAID"));
        CountryWorkspaceService.Metrics metrics = workspace.metrics(COUNTRY, "2026-10");
        assertEquals("0.20", metrics.expectedCompensation());
        assertEquals(2L, metrics.freeUsageCredits());
        assertEquals(1L, metrics.paidUsageCredits());
    }

    @Test
    void utcMonthBoundarySeparatesConfirmedEmptyAndSelectedMonths() {
        UUID hq = insertUser("SUPER_ADMIN");
        asUser(hq);
        countries.createCountry(COUNTRY, "Calendar Home", "USD");
        CountryWorkspaceService.Metrics october = workspace.metrics(COUNTRY, "2026-10");
        assertEquals("2026-10", october.period());
        assertEquals("2026-09", october.lastMonthPeriod());
        assertNull(october.confirmedCompensation());
        assertNull(october.lastMonthConfirmedCompensation());
        CountryWorkspaceService.Metrics january = workspace.metrics(COUNTRY, "2026-01");
        assertEquals("2025-12", january.lastMonthPeriod());
        CountryWorkspaceService.Metrics december = workspace.metrics(COUNTRY, "2026-12");
        assertEquals("2026-11", december.lastMonthPeriod());
        CountryWorkspaceService.Metrics current = workspace.metrics(COUNTRY, " ");
        assertEquals(YearMonth.now(ZoneOffset.UTC).toString(), current.period());
        assertEquals(YearMonth.now(ZoneOffset.UTC).minusMonths(1).toString(), current.lastMonthPeriod());
        ResponseStatusException invalid = assertThrows(ResponseStatusException.class, () -> workspace.metrics(COUNTRY, "2026-13"));
        assertEquals(400, invalid.getStatusCode().value());
        assertEquals("PERIOD_INVALID", invalid.getReason());
    }

    private Draft moneyContract(UUID agencyId, UUID rep, String number) {
        return new Draft(
                number + "-" + UUID.randomUUID(), COUNTRY, agencyId, "Counterparty", rep, "Entity",
                LocalDate.parse("2026-10-01"), null, 2000, SettlementMath.BASIS_PAID_USAGE,
                SettlementMath.ROUNDING_HALF_UP, "USD", 0L, 0L, "qa exception",
                SettlementMath.REFUND_DEDUCT, SettlementMath.DEDUCTION_FIXED, SettlementMath.DEDUCTION_FIXED);
    }

    private static CreateApplicationRequest request(UUID auditionId, String nationality) {
        CreateApplicationRequest body = new CreateApplicationRequest();
        body.setAuditionId(auditionId);
        body.setName("QA Applicant");
        body.setNationality(nationality);
        body.setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        return body;
    }

    private void setFee(long usd) {
        jdbc.update("UPDATE platform_application_fee SET amount_usd = ? WHERE id = 1", usd);
    }

    private UUID insertPackage(String name, long creditsAmount) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO credit_packages (id, name, price, credits, bonus_credits) VALUES (?, ?, ?, ?, 0)",
                id, name, creditsAmount, creditsAmount);
        return id;
    }

    private UUID insertAudition(UUID ownerId, UUID branchId, String mode) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, posting_branch_id, group_id, process_mode)
                VALUES (?, ?, 'qa exception', 'desc', 'OPEN', 'PH', ?, ?, ?)
                """, id, ownerId, branchId, id, mode);
        return id;
    }

    private UUID insertUser(String role) {
        UUID id = UUID.randomUUID();
        String handle = "q" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, 'PH')
                """, id, handle + "@qa.ex.test", role, handle, handle, handle);
        return id;
    }

    private long balance(UUID userId) {
        Long value = jdbc.queryForObject("SELECT balance FROM user_credits WHERE user_id = ?", Long.class, userId);
        return value == null ? 0 : value;
    }

    private long bucketCredits(UUID userId, String bucket) {
        Long value = jdbc.queryForObject("""
                SELECT COALESCE(SUM(a.credits), 0)
                FROM credit_lot_allocations a
                JOIN credit_transactions t ON t.id = a.usage_credit_transaction_id
                WHERE t.user_id = ? AND a.bucket = ? AND a.status = 'ALLOCATED'
                """, Long.class, userId, bucket);
        return value == null ? 0 : value;
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private static void asApplicant(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_APPLICANT"), new SimpleGrantedAuthority("ROLE_USER"))));
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }
}
