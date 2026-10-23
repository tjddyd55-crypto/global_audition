package com.audition.platform.application.org;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SettlementPolicyTest {

    @Test
    void exactRateSplitsBaseAndLeavesHqShareConsistent() {
        SettlementMath.Result result = SettlementMath.compute(terms(2000), new BigDecimal("100"), new BigDecimal("40"));
        assertEquals(SettlementMath.CALCULATED, result.status());
        assertEquals(new BigDecimal("60.00"), result.base().settled());
        assertEquals(new BigDecimal("12.00"), result.compensation().settled());
        assertEquals(new BigDecimal("48.00"), result.hq().settled());
        assertEquals(0, result.base().settled().compareTo(result.compensation().settled().add(result.hq().settled())));
        assertEquals(0, result.compensation().difference().compareTo(BigDecimal.ZERO.setScale(2)));
    }

    @Test
    void missingRateDoesNotComputePayout() {
        SettlementMath.Result result = SettlementMath.compute(
                new SettlementMath.Terms(null, SettlementMath.BASIS_PAID_USAGE, SettlementMath.ROUNDING_HALF_UP,
                        SettlementMath.REFUND_DEDUCT, SettlementMath.DEDUCTION_FIXED, 0L,
                        SettlementMath.DEDUCTION_FIXED, 0L),
                new BigDecimal("100"), BigDecimal.ZERO);
        assertEquals(SettlementMath.NEEDS_CONFIRMATION, result.status());
        assertNull(result.compensation());
        assertNull(result.hq());
    }

    @Test
    void aggregateHalfUpDiffersFromPerTransactionRounding() {
        SettlementMath.Result one = SettlementMath.compute(terms(3333), BigDecimal.ONE, BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.33"), one.compensation().settled());
        assertEquals(new BigDecimal("0.66"), one.compensation().settled().add(one.compensation().settled()));
        SettlementMath.Result aggregate = SettlementMath.compute(terms(3333), new BigDecimal("2"), BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.6666"), aggregate.compensation().raw());
        assertEquals(new BigDecimal("0.67"), aggregate.compensation().settled());
        assertEquals(new BigDecimal("0.0034"), aggregate.compensation().difference());
        assertEquals(new BigDecimal("1.33"), aggregate.hq().settled());
        assertEquals(0, aggregate.base().settled().compareTo(
                aggregate.compensation().settled().add(aggregate.hq().settled())));
    }

    @Test
    void undecidedRoundingDoesNotInventAPayout() {
        SettlementMath.Result result = SettlementMath.compute(
                new SettlementMath.Terms(2000, SettlementMath.BASIS_PAID_USAGE, "UNDECIDED",
                        SettlementMath.REFUND_DEDUCT, SettlementMath.DEDUCTION_FIXED, 0L,
                        SettlementMath.DEDUCTION_FIXED, 0L),
                new BigDecimal("3"), BigDecimal.ZERO);
        assertEquals("ROUNDING_POLICY_UNCONFIRMED", result.note());
        assertNull(result.compensation());
    }

    @Test
    void cashCollectionIsNotAddedToCreditUsage() {
        RevenueSplit.Totals totals = RevenueSplit.totals(List.of(
                new RevenueSplit.Line(AttributionPlanner.ACCOUNTING, "REVENUE", 100L, null),
                new RevenueSplit.Line(AttributionPlanner.SALES, "REVENUE", null, 100L)));
        assertEquals(100L, totals.accountingCashUsd());
        assertEquals(100L, totals.salesFeeSnapshotUsd());
        assertNull(totals.salesCashUsd());
        assertEquals(AttributionPlanner.CASH_MAPPING_UNDECIDED, totals.salesCashNote());
    }

    @Test
    void freeCreditsAreSpentBeforePaidCredits() {
        UUID user = UUID.randomUUID();
        CreditAllocation.Lot paid = new CreditAllocation.Lot(
                UUID.randomUUID(), user, UUID.randomUUID(), CreditAllocation.PAID, 10, 10, true, Instant.parse("2026-01-01T00:00:00Z"));
        CreditAllocation.Lot free = new CreditAllocation.Lot(
                UUID.randomUUID(), user, null, CreditAllocation.FREE, 2, 0, true, Instant.parse("2026-01-01T00:00:01Z"));
        CreditAllocation.Use mixed = new CreditAllocation.Use(
                UUID.randomUUID(), user, 3, Instant.parse("2026-01-02T00:00:00Z"));
        CreditAllocation.Replay replay = CreditAllocation.replay(List.of(paid, free), List.of(mixed), CreditAllocation.POLICY_FREE_FIRST);
        assertEquals(2, replay.outcomes().size());
        CreditAllocation.Outcome freeOutcome = replay.outcomes().get(0);
        CreditAllocation.Outcome paidOutcome = replay.outcomes().get(1);
        assertEquals(CreditAllocation.FREE, freeOutcome.bucket());
        assertEquals(2L, freeOutcome.credits());
        assertEquals(0L, freeOutcome.payableUsd());
        assertEquals(CreditAllocation.PAID, paidOutcome.bucket());
        assertEquals(1L, paidOutcome.credits());
        assertEquals(1L, paidOutcome.payableUsd());
        assertEquals(9L, replay.lots().get(0).remainingCredits());
        assertEquals(0L, replay.lots().get(1).remainingCredits());
        assertEquals(3L, freeOutcome.credits() + paidOutcome.credits());
    }

    @Test
    void paidOnlyAndFreeOnlyStaySeparate() {
        UUID user = UUID.randomUUID();
        CreditAllocation.Lot paid = new CreditAllocation.Lot(
                UUID.randomUUID(), user, UUID.randomUUID(), CreditAllocation.PAID, 10, 10, true, Instant.parse("2026-01-01T00:00:00Z"));
        CreditAllocation.Use clear = new CreditAllocation.Use(
                UUID.randomUUID(), user, 4, Instant.parse("2026-01-02T00:00:00Z"));
        CreditAllocation.Replay paidOnly = CreditAllocation.replay(List.of(paid), List.of(clear), CreditAllocation.POLICY_FREE_FIRST);
        assertEquals(CreditAllocation.ALLOCATED, paidOnly.outcomes().get(0).status());
        assertEquals(4L, paidOnly.outcomes().get(0).payableUsd());
        assertEquals(6L, paidOnly.lots().get(0).remainingCredits());

        CreditAllocation.Lot free = new CreditAllocation.Lot(
                UUID.randomUUID(), user, null, CreditAllocation.FREE, 5, 0, true, Instant.parse("2026-01-01T00:00:00Z"));
        CreditAllocation.Use use = new CreditAllocation.Use(
                UUID.randomUUID(), user, 5, Instant.parse("2026-01-02T00:00:00Z"));
        CreditAllocation.Replay freeOnly = CreditAllocation.replay(List.of(free), List.of(use), CreditAllocation.POLICY_FREE_FIRST);
        assertEquals(0L, freeOnly.outcomes().get(0).payableUsd());
        assertEquals(0L, freeOnly.lots().get(0).remainingCredits());
    }

    @Test
    void insufficientOrUnconfirmedUsageIsNotEstimated() {
        UUID user = UUID.randomUUID();
        CreditAllocation.Lot paid = new CreditAllocation.Lot(
                UUID.randomUUID(), user, UUID.randomUUID(), CreditAllocation.PAID, 1, 1, true, Instant.parse("2026-01-01T00:00:00Z"));
        CreditAllocation.Lot free = new CreditAllocation.Lot(
                UUID.randomUUID(), user, null, CreditAllocation.FREE, 1, 0, true, Instant.parse("2026-01-01T00:00:01Z"));
        CreditAllocation.Lot unclassified = new CreditAllocation.Lot(
                UUID.randomUUID(), user, UUID.randomUUID(), CreditAllocation.UNCLASSIFIED, 5, 0, false, Instant.parse("2026-01-01T00:00:02Z"));
        CreditAllocation.Use shortfall = new CreditAllocation.Use(
                UUID.randomUUID(), user, 3, Instant.parse("2026-01-02T00:00:00Z"));
        CreditAllocation.Replay review = CreditAllocation.replay(
                List.of(paid, free, unclassified), List.of(shortfall), CreditAllocation.POLICY_FREE_FIRST);
        assertEquals(CreditAllocation.REVIEW, review.outcomes().get(0).status());
        assertNull(review.outcomes().get(0).payableUsd());
        assertEquals(1L, review.lots().get(0).remainingCredits());
        assertEquals(1L, review.lots().get(1).remainingCredits());
        assertEquals(5L, review.lots().get(2).remainingCredits());

        CreditAllocation.Replay unconfirmed = CreditAllocation.replay(
                List.of(paid), List.of(shortfall), CreditAllocation.POLICY_UNCONFIRMED);
        assertEquals(CreditAllocation.REVIEW, unconfirmed.outcomes().get(0).status());
        assertEquals(1L, unconfirmed.lots().get(0).remainingCredits());
        assertTrue(review.outcomes().stream().noneMatch(row -> CreditAllocation.PENDING.equals(row.status())));
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
                10L,
                List.of(
                        new AttributionPlanner.Window(contractA, UUID.randomUUID(), 1, "QZ", UUID.randomUUID(), LocalDate.parse("2026-01-01"), null),
                        new AttributionPlanner.Window(contractB, UUID.randomUUID(), 1, "QY", UUID.randomUUID(), LocalDate.parse("2026-01-01"), null))));
        assertNull(plan.attributedCountry());
        assertEquals(AttributionPlanner.NEEDS_CONFIRMATION, plan.confirmationState());
    }

    @Test
    void presignTtlIsFiveMinutes() {
        assertEquals(300, ContractObjectStorage.DOWNLOAD_TTL.toSeconds());
    }

    private static SettlementMath.Terms terms(int rateBps) {
        return new SettlementMath.Terms(
                rateBps, SettlementMath.BASIS_PAID_USAGE, SettlementMath.ROUNDING_HALF_UP,
                SettlementMath.REFUND_DEDUCT, SettlementMath.DEDUCTION_FIXED, 0L,
                SettlementMath.DEDUCTION_FIXED, 0L);
    }
}
