package com.audition.platform.application.org;

import com.audition.platform.application.org.ContractService.ContractView;
import com.audition.platform.application.org.ContractService.Draft;
import com.audition.platform.application.org.CrmService.AgencyDraft;
import com.audition.platform.application.org.JdbcCrmStore.AgencyRow;
import com.audition.platform.application.org.SettlementService.SettlementView;
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

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

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
class OrgScenarioIT {

    private static final String HOME = "QZ";
    private static final String OTHER = "QY";

    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private CountryOrgService countries;
    @Autowired
    private CrmService crm;
    @Autowired
    private ContractService contracts;
    @Autowired
    private JdbcContractStore contractStore;
    @Autowired
    private AttributionService attributions;
    @Autowired
    private SettlementService settlements;
    @Autowired
    private StatsService stats;

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
        jdbc.update("DELETE FROM settlement_adjustments WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM settlement_lines WHERE settlement_id IN (SELECT id FROM monthly_settlements WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM monthly_settlements WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM revenue_attributions WHERE attributed_country IN (?, ?) OR credit_transaction_id IN (SELECT id FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')) OR payment_order_id IN (SELECT id FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test'))", HOME, OTHER);
        jdbc.update("DELETE FROM contract_documents WHERE contract_id IN (SELECT id FROM contracts WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM contract_versions WHERE contract_id IN (SELECT id FROM contracts WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM contracts WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM crm_activities WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM crm_approval_events WHERE crm_agency_id IN (SELECT id FROM crm_agencies WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM crm_stage_events WHERE crm_agency_id IN (SELECT id FROM crm_agencies WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM country_staff_agencies WHERE crm_agency_id IN (SELECT id FROM crm_agencies WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM applications WHERE applicant_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')");
        jdbc.update("DELETE FROM auditions WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')");
        jdbc.update("DELETE FROM crm_agencies WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM country_staff_permissions WHERE assignment_id IN (SELECT id FROM country_staff_assignments WHERE country_code IN (?, ?))", HOME, OTHER);
        jdbc.update("DELETE FROM country_staff_assignments WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM country_admin_appointments WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM country_org_audit WHERE country_code IN (?, ?)", HOME, OTHER);
        jdbc.update("DELETE FROM credit_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')");
        jdbc.update("DELETE FROM payment_orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')");
        jdbc.update("DELETE FROM credit_packages WHERE name = 'org-flow-package'");
        jdbc.update("DELETE FROM users WHERE email LIKE '%@org.flow.test'");
        jdbc.update("DELETE FROM countries WHERE code IN (?, ?)", HOME, OTHER);
    }

    @Test
    void countryCrmContractAttributionAndSettlementStayScoped() throws Exception {
        int preservedPayments = count("SELECT COUNT(*) FROM payment_orders WHERE order_no NOT LIKE 'ORG-FLOW-%'");
        int preservedCredits = count("SELECT COUNT(*) FROM credit_transactions WHERE user_id NOT IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')");
        UUID hq = insertUser("SUPER_ADMIN", "PH");
        UUID firstRep = insertUser("USER", "QZ");
        UUID secondRep = insertUser("USER", "QZ");
        UUID otherRep = insertUser("USER", "QY");
        UUID limited = insertUser("USER", "QZ");
        UUID seller = insertUser("USER", "QZ");
        UUID agencyUser = insertUser("USER", "QZ");
        UUID applicant = insertUser("USER", "PH");
        asUser(hq);
        countries.createCountry(HOME, "Queue Home", "USD");
        countries.createCountry(OTHER, "Queue Other", "USD");
        countries.appointRepresentative(HOME, firstRep, null);
        countries.appointRepresentative(OTHER, otherRep, null);
        asUser(otherRep);
        assertThrows(ResponseStatusException.class, () -> crm.list(HOME));
        asUser(hq);
        countries.appointRepresentative(HOME, secondRep, "ROTATION");
        assertEquals(2, countries.history(HOME).size());
        assertEquals(1, count("SELECT COUNT(*) FROM country_admin_appointments WHERE country_code = 'QZ' AND status = 'ACTIVE'"));
        asUser(secondRep);
        assertThrows(ResponseStatusException.class, () -> countries.addStaff(HOME, limited, List.of(OrgRoles.PERM_RATE_EDIT)));
        asUser(hq);
        ResponseStatusException notForStaff = assertThrows(ResponseStatusException.class,
                () -> countries.addStaff(HOME, limited, List.of(OrgRoles.PERM_SETTLEMENT_APPROVE)));
        assertEquals(400, notForStaff.getStatusCode().value());
        asUser(secondRep);
        countries.addStaff(HOME, limited, List.of(OrgRoles.PERM_CONSULT_LOG));
        countries.addStaff(HOME, seller, List.of(
                OrgRoles.PERM_CRM_READ, OrgRoles.PERM_CRM_WRITE, OrgRoles.PERM_CONSULT_LOG, OrgRoles.PERM_AGENCY_REVIEW));
        AgencyRow homeAgency = crm.register(agency(HOME, "Home Agency", seller, agencyUser));
        AgencyRow unassigned = crm.register(agency(HOME, "Unassigned Agency", null, null));
        asUser(otherRep);
        AgencyRow otherBranch = crm.register(agency(OTHER, "Other Branch", null, agencyUser));
        asUser(secondRep);
        asUser(limited);
        assertThrows(ResponseStatusException.class, () -> crm.list(HOME));
        asUser(seller);
        assertEquals(1, crm.list(HOME).size());
        crm.logConsult(homeAgency.id(), "첫 상담");
        ResponseStatusException unassignedDenied = assertThrows(ResponseStatusException.class,
                () -> crm.logConsult(unassigned.id(), "범위 밖"));
        assertEquals("AGENCY_NOT_ASSIGNED", unassignedDenied.getReason());
        asUser(secondRep);
        crm.decide(homeAgency.id(), AgencyApproval.SUBMIT, "서류 접수", null);
        crm.decide(homeAgency.id(), AgencyApproval.RECOMMEND, "국가 추천", null);
        ResponseStatusException blocked = assertThrows(ResponseStatusException.class,
                () -> crm.decide(homeAgency.id(), AgencyApproval.HQ_APPROVE, "국가에서 승인 시도", agencyUser));
        assertEquals(403, blocked.getStatusCode().value());
        assertEquals("HQ_APPROVAL_REQUIRED", blocked.getReason());
        asUser(otherRep);
        crm.decide(otherBranch.id(), AgencyApproval.SUBMIT, "지점 접수", null);
        crm.decide(otherBranch.id(), AgencyApproval.RECOMMEND, "타국 추천", null);
        asUser(hq);
        AgencyRow approved = crm.decide(homeAgency.id(), AgencyApproval.HQ_APPROVE, "본사 승인", agencyUser);
        crm.decide(otherBranch.id(), AgencyApproval.HQ_APPROVE, "본사 승인", agencyUser);
        assertEquals(AgencyApproval.APPROVED, approved.approvalState());
        assertEquals("ACTIVE", approved.stage());
        assertTrue(count("SELECT COUNT(*) FROM crm_approval_events WHERE crm_agency_id = '" + homeAgency.id() + "'") >= 3);
        ContractView unset = contracts.create(new Draft(
                "ORG-UNSET-" + UUID.randomUUID(), HOME, unassigned.id(), "Unset Counterparty", firstRep, "Entity",
                LocalDate.parse("2026-01-01"), null, null, null, null, "USD", null, null, null));
        SettlementView needsTerms = settlements.calculate(HOME, unset.id(), "2026-01");
        assertEquals(SettlementMath.NEEDS_CONFIRMATION, needsTerms.status());
        assertNull(needsTerms.compensationUsd());
        ContractView money = contracts.create(new Draft(
                "ORG-MONEY-" + UUID.randomUUID(), HOME, homeAgency.id(), "Money Counterparty", firstRep, "Entity",
                LocalDate.parse("2026-01-01"), LocalDate.parse("2026-01-31"), 2000, SettlementMath.BASIS_CASH_COLLECTED,
                SettlementMath.ROUNDING_UNDECIDED, "USD", 0L, 0L, "explicit test rate"));
        asUser(secondRep);
        assertThrows(ResponseStatusException.class, () -> contracts.addVersion(money.id(), new Draft(
                null, HOME, homeAgency.id(), "Money Counterparty", secondRep, "Entity",
                LocalDate.parse("2026-02-01"), null, 2500, SettlementMath.BASIS_CASH_COLLECTED,
                SettlementMath.ROUNDING_UNDECIDED, "USD", 0L, 0L, "country edit")));
        asUser(hq);
        contracts.addVersion(money.id(), new Draft(
                null, HOME, homeAgency.id(), "Money Counterparty", firstRep, "Entity",
                LocalDate.parse("2026-02-01"), null, 2500, SettlementMath.BASIS_CASH_COLLECTED,
                SettlementMath.ROUNDING_UNDECIDED, "USD", 0L, 0L, "february rate"));
        assertEquals(2, contractStore.versions(money.id()).size());
        assertEquals(firstRep, contractStore.find(money.id()).orElseThrow().representativeUserId());
        contracts.attach(money.id(), "terms.txt", "text/plain", "terms".getBytes());
        assertEquals("terms", new String(contracts.download(money.id()).body()));
        ContractView otherContract = contracts.create(new Draft(
                "ORG-OTHER-" + UUID.randomUUID(), OTHER, otherBranch.id(), "Other Counterparty", otherRep, "Entity",
                LocalDate.parse("2026-01-01"), null, 1500, SettlementMath.BASIS_CASH_COLLECTED,
                SettlementMath.ROUNDING_UNDECIDED, "USD", 0L, 0L, null));
        UUID januaryAudition = insertAudition(agencyUser, homeAgency.id(), "PH");
        UUID februaryAudition = insertAudition(agencyUser, homeAgency.id(), "PH");
        UUID ambiguousAudition = insertAudition(agencyUser, null, "PH");
        insertApplication(januaryAudition, applicant);
        insertApplication(februaryAudition, applicant);
        UUID januaryCredit = insertUse(applicant, januaryAudition, "2026-01-15T00:00:00Z", 10);
        UUID februaryCredit = insertUse(applicant, februaryAudition, "2026-02-15T00:00:00Z", 10);
        insertUse(applicant, ambiguousAudition, "2026-01-20T00:00:00Z", 10);
        assertEquals(3, attributions.reconcileApplyUses());
        assertEquals(0, attributions.reconcileApplyUses());
        assertAttribution(januaryCredit, HOME, contractStore.versions(money.id()).get(0).id(), null);
        assertAttribution(februaryCredit, HOME, contractStore.versions(money.id()).get(1).id(), null);
        String ambiguousCountry = jdbc.queryForObject(
                "SELECT attributed_country FROM revenue_attributions WHERE audition_id = ?",
                String.class, ambiguousAudition);
        assertNull(ambiguousCountry);
        UUID packageId = UUID.randomUUID();
        jdbc.update("INSERT INTO credit_packages (id, name, price, credits, bonus_credits) VALUES (?, 'org-flow-package', 100, 100, 0)", packageId);
        UUID januaryPayment = insertPayment(applicant, packageId, 100, "2026-01-15T00:00:00Z");
        UUID februaryPayment = insertPayment(applicant, packageId, 100, "2026-02-15T00:00:00Z");
        attributions.linkCash(januaryPayment, money.id());
        assertThrows(ResponseStatusException.class, () -> attributions.linkCash(januaryPayment, money.id()));
        attributions.recordRefund(januaryPayment, 40, "partial refund of collected cash");
        asUser(seller);
        assertThrows(ResponseStatusException.class, () -> settlements.calculate(HOME, money.id(), "2026-01"));
        asUser(otherRep);
        assertThrows(ResponseStatusException.class, () -> settlements.calculate(HOME, money.id(), "2026-01"));
        asUser(hq);
        SettlementView january = settlements.calculate(HOME, money.id(), "2026-01");
        SettlementView januaryAgain = settlements.calculate(HOME, money.id(), "2026-01");
        assertEquals(january.id(), januaryAgain.id());
        assertEquals(1, count("SELECT COUNT(*) FROM monthly_settlements WHERE country_code = 'QZ' AND period_key = '2026-01' AND contract_id = '" + money.id() + "'"));
        assertEquals(60L, january.settlementBaseUsd());
        assertEquals(12L, january.compensationUsd());
        assertEquals(48L, january.hqShareUsd());
        assertEquals(january.settlementBaseUsd() - january.compensationUsd(), january.hqShareUsd());
        attributions.linkCash(februaryPayment, money.id());
        SettlementView february = settlements.calculate(HOME, money.id(), "2026-02");
        assertEquals(100L, february.settlementBaseUsd());
        assertEquals(25L, february.compensationUsd());
        assertEquals(75L, february.hqShareUsd());
        StatsService.CountrySlice slice = stats.global(HOME, null).slices().stream()
                .filter(row -> HOME.equals(row.country()))
                .findFirst()
                .orElseThrow();
        assertEquals(200L, slice.accountingRevenueUsd());
        assertEquals(40L, slice.refundsUsd());
        assertEquals(20L, slice.salesFeeSnapshotUsd());
        assertNull(slice.salesCashUsd());
        assertEquals(160L, slice.settlementBaseUsd());
        assertTrue(slice.accountingRevenueUsd() != slice.settlementBaseUsd());
        asUser(secondRep);
        assertThrows(ResponseStatusException.class, () -> settlements.approve(january.id()));
        settlements.submitReview(january.id());
        asUser(hq);
        SettlementView approvedSettlement = settlements.approve(january.id());
        assertEquals("APPROVED", approvedSettlement.status());
        UUID extraPayment = insertPayment(applicant, packageId, 100, "2026-01-18T00:00:00Z");
        attributions.linkCash(extraPayment, money.id());
        SettlementView frozen = settlements.calculate(HOME, money.id(), "2026-01");
        assertEquals(12L, frozen.compensationUsd());
        int paymentsBeforePayout = count("SELECT COUNT(*) FROM payment_orders");
        SettlementView paid = settlements.recordPayout(january.id(), "manual ledger note only");
        assertEquals("PAID", paid.status());
        assertEquals(paymentsBeforePayout, count("SELECT COUNT(*) FROM payment_orders"));
        SettlementView adjusted = settlements.adjust(january.id(), "operator correction request", 1L);
        assertEquals("ADJUSTMENT_REQUIRED", adjusted.status());
        assertEquals(12L, adjusted.compensationUsd());
        assertEquals(1, count("SELECT COUNT(*) FROM settlement_adjustments WHERE settlement_id = '" + january.id() + "'"));
        contracts.end(money.id(), "term ended");
        ResponseStatusException revoked = assertThrows(ResponseStatusException.class, () -> contracts.download(money.id()));
        assertEquals("CONTRACT_ACCESS_REVOKED", revoked.getReason());
        assertEquals(2, contractStore.versions(money.id()).size());
        StatsService.CountryDetail detail = stats.country(HOME, null, null, null, null, null, null);
        assertTrue(detail.agenciesRegistered() >= 2);
        assertTrue(detail.approvalCount() != null && detail.approvalCount().contains("/"));
        assertEquals(preservedPayments, count("SELECT COUNT(*) FROM payment_orders WHERE order_no NOT LIKE 'ORG-FLOW-%'"));
        assertEquals(preservedCredits, count("SELECT COUNT(*) FROM credit_transactions WHERE user_id NOT IN (SELECT id FROM users WHERE email LIKE '%@org.flow.test')"));
        assertTrue(otherContract.id() != null);
        for (String file : List.of("V50__agency_crm.sql", "V51__contracts.sql", "V52__revenue_attribution_settlement.sql")) {
            String sql = java.nio.file.Files.readString(java.nio.file.Path.of("src/main/resources/db/migration/" + file)).toLowerCase();
            assertTrue(!sql.contains("update public.credit_transactions"));
            assertTrue(!sql.contains("update public.payment_orders"));
            assertTrue(!sql.contains("delete from public.credit_transactions"));
            assertTrue(!sql.contains("delete from public.payment_orders"));
        }
    }

    private void assertAttribution(UUID creditId, String country, UUID versionId, Long collected) {
        String foundCountry = jdbc.queryForObject(
                "SELECT trim(attributed_country) FROM revenue_attributions WHERE credit_transaction_id = ?",
                String.class, creditId);
        UUID foundVersion = jdbc.queryForObject(
                "SELECT contract_version_id FROM revenue_attributions WHERE credit_transaction_id = ?",
                UUID.class, creditId);
        Long foundCollected = jdbc.queryForObject(
                "SELECT collected_usd FROM revenue_attributions WHERE credit_transaction_id = ?",
                Long.class, creditId);
        assertEquals(country, foundCountry);
        assertEquals(versionId, foundVersion);
        assertEquals(collected, foundCollected);
    }

    private AgencyDraft agency(String country, String name, UUID staff, UUID linkedUser) {
        return new AgencyDraft(country, name, name + " Legal", "BR-" + name, "Contact", "c@example.com", "000", "https://example.com", staff, linkedUser, "note");
    }

    private UUID insertAudition(UUID ownerId, UUID branchId, String audienceCountry) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO auditions (id, owner_id, title, description, status, country_code, posting_branch_id, group_id)
                VALUES (?, ?, 'org flow', 'desc', 'OPEN', ?, ?, ?)
                """, id, ownerId, audienceCountry, branchId, id);
        return id;
    }

    private void insertApplication(UUID auditionId, UUID applicantId) {
        jdbc.update("""
                INSERT INTO applications (id, audition_id, applicant_id, status)
                VALUES (?, ?, ?, 'SUBMITTED')
                """, UUID.randomUUID(), auditionId, applicantId);
    }

    private UUID insertUse(UUID userId, UUID auditionId, String instant, long fee) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO credit_transactions (
                    id, user_id, amount, type, reason, reference_id, applied_fee_usd, applied_credit_quantity, created_at
                ) VALUES (?, ?, ?, 'USE', 'AUDITION_APPLY', ?, ?, ?, ?)
                """, id, userId, -fee, auditionId.toString(), fee, fee, Timestamp.from(OffsetDateTime.parse(instant).toInstant()));
        return id;
    }

    private UUID insertPayment(UUID userId, UUID packageId, long amount, String instant) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO payment_orders (
                    id, order_no, user_id, package_id, provider, amount, currency, status, credits, bonus_credits, paid_at
                ) VALUES (?, ?, ?, ?, 'TEST', ?, 'USD', 'PAID', ?, 0, ?)
                """, id, "ORG-FLOW-" + id, userId, packageId, amount, amount, Timestamp.from(OffsetDateTime.parse(instant).toInstant()));
        return id;
    }

    private UUID insertUser(String role, String country) {
        UUID id = UUID.randomUUID();
        String handle = "u" + id.toString().replace("-", "").substring(0, 12);
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, role, username, display_name, nickname, country_code)
                VALUES (?, ?, 'x', ?, ?, ?, ?, ?)
                """, id, handle + "@org.flow.test", role, handle, handle, handle, country);
        return id;
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private static void asUser(UUID id) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }
}
