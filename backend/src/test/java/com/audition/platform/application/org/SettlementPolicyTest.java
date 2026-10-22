package com.audition.platform.application.org;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class SettlementPolicyTest {

    @Test
    void exactRateSplitsBaseAndLeavesHqShareConsistent() {
        SettlementMath.Result result = SettlementMath.compute(
                100, 40, 0L, 0L, 2000, SettlementMath.BASIS_CASH_COLLECTED, SettlementMath.ROUNDING_UNDECIDED);
        assertEquals(SettlementMath.CALCULATED, result.status());
        assertEquals(60L, result.baseUsd());
        assertEquals(12L, result.compensationUsd());
        assertEquals(48L, result.hqShareUsd());
        assertEquals(result.baseUsd() - result.compensationUsd(), result.hqShareUsd());
    }

    @Test
    void missingRateDoesNotComputePayout() {
        SettlementMath.Result result = SettlementMath.compute(
                100, 0, 0L, 0L, null, SettlementMath.BASIS_CASH_COLLECTED, SettlementMath.ROUNDING_UNDECIDED);
        assertEquals(SettlementMath.NEEDS_CONFIRMATION, result.status());
        assertNull(result.compensationUsd());
        assertNull(result.hqShareUsd());
    }

    @Test
    void fractionalProductStaysUnrounded() {
        SettlementMath.Result result = SettlementMath.compute(
                3, 0, 0L, 0L, 2000, SettlementMath.BASIS_CASH_COLLECTED, SettlementMath.ROUNDING_UNDECIDED);
        assertEquals("ROUNDING_UNDECIDED", result.note());
        assertEquals(3L, result.baseUsd());
        assertNull(result.compensationUsd());
    }

    @Test
    void creditUsageIsNotAddedToCash() {
        RevenueSplit.Totals totals = RevenueSplit.totals(List.of(
                new RevenueSplit.Line(AttributionPlanner.ACCOUNTING, "REVENUE", 100L, null),
                new RevenueSplit.Line(AttributionPlanner.SALES, "REVENUE", null, 100L)));
        assertEquals(100L, totals.accountingCashUsd());
        assertEquals(100L, totals.salesFeeSnapshotUsd());
        assertNull(totals.salesCashUsd());
        assertEquals(AttributionPlanner.CASH_MAPPING_UNDECIDED, totals.salesCashNote());
    }

    @Test
    void attributionIgnoresApplicantNationalityAndKeepsVersion() {
        UUID branch = UUID.randomUUID();
        UUID contract = UUID.randomUUID();
        UUID january = UUID.randomUUID();
        UUID february = UUID.randomUUID();
        List<AttributionPlanner.Window> windows = List.of(
                new AttributionPlanner.Window(contract, january, 1, "QZ", branch, LocalDate.parse("2026-01-01"), LocalDate.parse("2026-01-31")),
                new AttributionPlanner.Window(contract, february, 2, "QZ", branch, LocalDate.parse("2026-02-01"), null));
        AttributionPlanner.Plan januaryPlan = AttributionPlanner.plan(new AttributionPlanner.Input(
                AttributionPlanner.SALES, branch, "PH", LocalDate.parse("2026-01-15"), 99L, windows));
        AttributionPlanner.Plan februaryPlan = AttributionPlanner.plan(new AttributionPlanner.Input(
                AttributionPlanner.SALES, branch, "PH", LocalDate.parse("2026-02-15"), 99L, windows));
        assertEquals("QZ", januaryPlan.attributedCountry());
        assertEquals(january, januaryPlan.contractVersionId());
        assertNull(januaryPlan.collectedUsd());
        assertEquals(february, februaryPlan.contractVersionId());
        assertEquals(AttributionPlanner.CASH_MAPPING_UNDECIDED, januaryPlan.cashMappingPolicy());
    }

    @Test
    void multipleBranchesWithoutPostingBranchNeedConfirmation() {
        UUID contractA = UUID.randomUUID();
        UUID contractB = UUID.randomUUID();
        AttributionPlanner.Plan plan = AttributionPlanner.plan(new AttributionPlanner.Input(
                AttributionPlanner.SALES,
                null,
                "PH",
                LocalDate.parse("2026-01-15"),
                null,
                List.of(
                        new AttributionPlanner.Window(contractA, UUID.randomUUID(), 1, "QZ", UUID.randomUUID(), LocalDate.parse("2026-01-01"), null),
                        new AttributionPlanner.Window(contractB, UUID.randomUUID(), 1, "QY", UUID.randomUUID(), LocalDate.parse("2026-01-01"), null))));
        assertEquals(AttributionPlanner.NEEDS_CONFIRMATION, plan.confirmationState());
        assertNull(plan.attributedCountry());
        assertEquals("BRANCH_UNCONFIRMED", plan.note());
    }
}
