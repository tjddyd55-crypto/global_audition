package com.audition.platform.application.org;

import com.audition.platform.application.org.CreditAllocation.Lot;
import com.audition.platform.application.org.CreditAllocation.Outcome;
import com.audition.platform.application.org.CreditAllocation.StoredLot;
import com.audition.platform.application.org.CreditAllocation.Use;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class JdbcCreditLotStore {

    private final JdbcTemplate jdbc;

    public JdbcCreditLotStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void rebuild() {
        String policy = jdbc.queryForObject(
                "SELECT allocation_policy FROM settlement_policies WHERE id = 1", String.class);
        List<Lot> lots = new ArrayList<>();
        lots.addAll(paymentLots());
        lots.addAll(freeLots());
        List<Use> uses = uses();
        CreditAllocation.Replay replay = CreditAllocation.replay(lots, uses, policy);
        jdbc.update("DELETE FROM credit_lot_allocations");
        jdbc.update("DELETE FROM credit_lots");
        for (StoredLot lot : replay.lots()) {
            jdbc.update("""
                    INSERT INTO credit_lots (
                        id, user_id, payment_order_id, source_credit_transaction_id, bucket,
                        original_credits, remaining_credits, cash_collected_usd, occurred_at, parity_ok
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    lot.id(), lot.userId(), lot.paymentOrderId(), null, lot.bucket(),
                    lot.originalCredits(), lot.remainingCredits(), lot.cashUsd(),
                    Timestamp.from(lot.occurredAt()), lot.parityOk());
        }
        for (Outcome outcome : replay.outcomes()) {
            jdbc.update("""
                    INSERT INTO credit_lot_allocations (
                        id, usage_credit_transaction_id, lot_id, bucket, credits, payable_usd,
                        status, policy_name, occurred_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    UUID.randomUUID(), outcome.useId(), outcome.lotId(), outcome.bucket(), outcome.credits(),
                    outcome.payableUsd(), outcome.status(), policy, Timestamp.from(outcome.occurredAt()));
        }
    }

    public List<UsageRow> usages(UUID contractId, Instant from, Instant to) {
        return jdbc.query("""
                SELECT ra.id AS attribution_id, ra.contract_version_id, a.status, a.payable_usd
                FROM revenue_attributions ra
                LEFT JOIN credit_lot_allocations a ON a.usage_credit_transaction_id = ra.credit_transaction_id
                WHERE ra.contract_id = ? AND ra.recognition = 'SALES' AND ra.line_kind = 'REVENUE'
                  AND ra.occurred_at >= ? AND ra.occurred_at < ?
                """, (rs, n) -> new UsageRow(
                rs.getObject("attribution_id", UUID.class),
                rs.getObject("contract_version_id", UUID.class),
                rs.getString("status"),
                (Long) rs.getObject("payable_usd")),
                contractId, Timestamp.from(from), Timestamp.from(to));
    }

    public List<RefundLink> refunds(Instant from, Instant to) {
        return jdbc.query("""
                SELECT payment_order_id, collected_usd
                FROM revenue_attributions
                WHERE line_kind = 'REFUND' AND collected_usd IS NOT NULL
                  AND occurred_at >= ? AND occurred_at < ?
                """, (rs, n) -> new RefundLink(
                rs.getObject("payment_order_id", UUID.class),
                rs.getLong("collected_usd")),
                Timestamp.from(from), Timestamp.from(to));
    }

    public List<PaidUse> paidUses(UUID paymentOrderId) {
        return jdbc.query("""
                SELECT a.status, a.payable_usd, ra.contract_id
                FROM credit_lots l
                JOIN credit_lot_allocations a ON a.lot_id = l.id
                LEFT JOIN revenue_attributions ra
                  ON ra.credit_transaction_id = a.usage_credit_transaction_id
                 AND ra.line_kind = 'REVENUE'
                WHERE l.payment_order_id = ? AND l.bucket = 'PAID'
                """, (rs, n) -> new PaidUse(
                rs.getString("status"),
                (Long) rs.getObject("payable_usd"),
                rs.getObject("contract_id", UUID.class)), paymentOrderId);
    }

    public long paidRemaining(UUID paymentOrderId) {
        Long remaining = jdbc.queryForObject("""
                SELECT COALESCE(SUM(remaining_credits), 0) FROM credit_lots
                WHERE payment_order_id = ? AND bucket = 'PAID'
                """, Long.class, paymentOrderId);
        return remaining == null ? 0 : remaining;
    }

    private List<Lot> paymentLots() {
        return jdbc.query("""
                SELECT id, user_id, amount, credits, bonus_credits, currency, COALESCE(paid_at, created_at) AS occurred_at
                FROM payment_orders
                WHERE status = 'PAID'
                """, (rs, n) -> {
            List<Lot> rows = new ArrayList<>();
            UUID paymentId = rs.getObject("id", UUID.class);
            UUID userId = rs.getObject("user_id", UUID.class);
            long amount = rs.getLong("amount");
            long credits = rs.getLong("credits");
            long bonus = rs.getLong("bonus_credits");
            boolean usd = "USD".equalsIgnoreCase(rs.getString("currency"));
            Instant at = rs.getTimestamp("occurred_at").toInstant();
            boolean parity = usd && credits > 0 && credits == amount;
            if (credits > 0) {
                rows.add(new Lot(
                        UUID.randomUUID(), userId, paymentId,
                        parity ? CreditAllocation.PAID : CreditAllocation.UNCLASSIFIED,
                        credits, parity ? amount : 0, parity, at));
            }
            if (bonus > 0) {
                rows.add(new Lot(
                        UUID.randomUUID(), userId, paymentId, CreditAllocation.FREE,
                        bonus, 0, true, at));
            }
            return rows;
        }).stream().flatMap(List::stream).toList();
    }

    private List<Lot> freeLots() {
        return jdbc.query("""
                SELECT id, user_id, amount, created_at
                FROM credit_transactions
                WHERE amount > 0 AND (
                    type = 'GRANT'
                    OR (type = 'CHARGE' AND reason = 'ADMIN_GRANT')
                )
                """, (rs, n) -> new Lot(
                UUID.randomUUID(),
                rs.getObject("user_id", UUID.class),
                null,
                CreditAllocation.FREE,
                rs.getLong("amount"),
                0,
                true,
                rs.getTimestamp("created_at").toInstant()));
    }

    private List<Use> uses() {
        return jdbc.query("""
                SELECT id, user_id, COALESCE(applied_credit_quantity, ABS(amount)) AS credits, created_at
                FROM credit_transactions
                WHERE type = 'USE' AND reason = 'AUDITION_APPLY'
                  AND COALESCE(applied_credit_quantity, ABS(amount)) > 0
                """, (rs, n) -> new Use(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getLong("credits"),
                rs.getTimestamp("created_at").toInstant()));
    }

    public record UsageRow(UUID attributionId, UUID versionId, String allocationStatus, Long payableUsd) {
    }

    public record RefundLink(UUID paymentOrderId, long amountUsd) {
    }

    public record PaidUse(String status, Long payableUsd, UUID contractId) {
    }
}
