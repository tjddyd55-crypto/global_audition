package com.audition.platform.application.org;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JdbcSettlementStore {

    private final JdbcTemplate jdbc;

    public JdbcSettlementStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ApplyUse> unattributedApplyUses() {
        return jdbc.query("""
                SELECT ct.id, ct.user_id, ct.reference_id, ct.created_at, ct.applied_fee_usd, u.country_code
                FROM credit_transactions ct
                JOIN users u ON u.id = ct.user_id
                WHERE ct.type = 'USE' AND ct.reason = 'AUDITION_APPLY'
                  AND NOT EXISTS (
                    SELECT 1 FROM revenue_attributions ra
                    WHERE ra.credit_transaction_id = ct.id AND ra.line_kind = 'REVENUE'
                  )
                ORDER BY ct.created_at
                """, (rs, n) -> new ApplyUse(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("reference_id"),
                rs.getTimestamp("created_at").toInstant(),
                (Long) rs.getObject("applied_fee_usd"),
                rs.getString("country_code")));
    }

    public Optional<AuditionRef> audition(UUID id) {
        List<AuditionRef> rows = jdbc.query("""
                SELECT id, owner_id, posting_branch_id FROM auditions WHERE id = ?
                """, (rs, n) -> new AuditionRef(
                rs.getObject("id", UUID.class),
                rs.getObject("owner_id", UUID.class),
                rs.getObject("posting_branch_id", UUID.class)), id);
        return rows.stream().findFirst();
    }

    public Optional<UUID> applicationId(UUID auditionId, UUID applicantId) {
        List<UUID> rows = jdbc.query("""
                SELECT id FROM applications WHERE audition_id = ? AND applicant_id = ?
                """, (rs, n) -> rs.getObject("id", UUID.class), auditionId, applicantId);
        return rows.stream().findFirst();
    }

    public List<UUID> approvedBranchesForOwner(UUID ownerId) {
        return jdbc.query("""
                SELECT id FROM crm_agencies
                WHERE linked_user_id = ? AND approval_state = 'APPROVED'
                """, (rs, n) -> rs.getObject("id", UUID.class), ownerId);
    }

    public Optional<PaidOrder> payment(UUID id) {
        List<PaidOrder> rows = jdbc.query("""
                SELECT id, amount, currency, status, COALESCE(paid_at, created_at) AS occurred_at
                FROM payment_orders WHERE id = ?
                """, (rs, n) -> new PaidOrder(
                rs.getObject("id", UUID.class),
                rs.getLong("amount"),
                rs.getString("currency"),
                rs.getString("status"),
                rs.getTimestamp("occurred_at").toInstant()), id);
        return rows.stream().findFirst();
    }

    public void insertAttribution(AttributionInsert row) {
        jdbc.update("""
                INSERT INTO revenue_attributions (
                    id, credit_transaction_id, payment_order_id, line_kind, recognition,
                    crm_agency_id, branch_id, attributed_country, audition_id, application_id,
                    occurred_at, applied_fee_usd, collected_usd, payment_status, refund_status,
                    contract_id, contract_version_id, cash_mapping_policy, confirmation_state, note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.creditTransactionId(), row.paymentOrderId(), row.lineKind(), row.recognition(),
                row.agencyId(), row.branchId(), row.country(), row.auditionId(), row.applicationId(),
                Timestamp.from(row.occurredAt()), row.appliedFeeUsd(), row.collectedUsd(),
                row.paymentStatus(), row.refundStatus(), row.contractId(), row.contractVersionId(),
                row.cashMappingPolicy(), row.confirmationState(), row.note());
    }

    public Optional<AttributionInsert> revenueLink(UUID paymentOrderId) {
        return one("""
                SELECT * FROM revenue_attributions
                WHERE payment_order_id = ? AND line_kind = 'REVENUE'
                """, paymentOrderId);
    }

    public long refundedUsd(UUID paymentOrderId) {
        Long sum = jdbc.queryForObject("""
                SELECT COALESCE(SUM(collected_usd), 0) FROM revenue_attributions
                WHERE payment_order_id = ? AND line_kind = 'REFUND'
                """, Long.class, paymentOrderId);
        return sum == null ? 0 : sum;
    }

    public List<AttributionInsert> attributionsForContract(UUID contractId, Instant from, Instant to) {
        return jdbc.query("""
                SELECT * FROM revenue_attributions
                WHERE contract_id = ? AND occurred_at >= ? AND occurred_at < ?
                ORDER BY occurred_at
                """, (rs, n) -> mapAttr(rs), contractId, Timestamp.from(from), Timestamp.from(to));
    }

    public Optional<SettlementRow> findSettlement(String country, UUID contractId, String period) {
        List<SettlementRow> rows = jdbc.query("""
                SELECT * FROM monthly_settlements
                WHERE country_code = ? AND contract_id = ? AND period_key = ?
                """, (rs, n) -> mapSettlement(rs), country, contractId, period);
        return rows.stream().findFirst();
    }

    public Optional<SettlementRow> findSettlementById(UUID id) {
        List<SettlementRow> rows = jdbc.query(
                "SELECT * FROM monthly_settlements WHERE id = ?",
                (rs, n) -> mapSettlement(rs), id);
        return rows.stream().findFirst();
    }

    public void insertSettlement(SettlementRow row) {
        jdbc.update("""
                INSERT INTO monthly_settlements (
                    id, country_code, contract_id, period_key, status,
                    target_revenue_usd, refunds_usd, payment_fees_usd, extra_deductions_usd,
                    settlement_base_usd, compensation_usd, hq_share_usd, rate_bps,
                    settlement_basis, rounding_policy, note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                row.id(), row.countryCode(), row.contractId(), row.periodKey(), row.status(),
                row.targetRevenueUsd(), row.refundsUsd(), row.paymentFeesUsd(), row.extraDeductionsUsd(),
                row.settlementBaseUsd(), row.compensationUsd(), row.hqShareUsd(), row.rateBps(),
                row.settlementBasis(), row.roundingPolicy(), row.note());
    }

    public void updateSettlement(SettlementRow row) {
        jdbc.update("""
                UPDATE monthly_settlements
                SET status = ?, target_revenue_usd = ?, refunds_usd = ?, payment_fees_usd = ?,
                    extra_deductions_usd = ?, settlement_base_usd = ?, compensation_usd = ?,
                    hq_share_usd = ?, rate_bps = ?, settlement_basis = ?, rounding_policy = ?,
                    note = ?, updated_at = NOW()
                WHERE id = ? AND status IN ('DRAFT', 'CALCULATED', 'NEEDS_CONFIRMATION')
                """,
                row.status(), row.targetRevenueUsd(), row.refundsUsd(), row.paymentFeesUsd(),
                row.extraDeductionsUsd(), row.settlementBaseUsd(), row.compensationUsd(), row.hqShareUsd(),
                row.rateBps(), row.settlementBasis(), row.roundingPolicy(), row.note(), row.id());
    }

    public void replaceLines(UUID settlementId, List<UUID> attributionIds) {
        jdbc.update("DELETE FROM settlement_lines WHERE settlement_id = ?", settlementId);
        for (UUID attributionId : attributionIds) {
            jdbc.update("""
                    INSERT INTO settlement_lines (id, settlement_id, attribution_id) VALUES (?, ?, ?)
                    """, UUID.randomUUID(), settlementId, attributionId);
        }
    }

    public int updateStatus(UUID id, String from, String to, UUID actor, String column) {
        if ("approved".equals(column)) {
            return jdbc.update("""
                    UPDATE monthly_settlements
                    SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
                    WHERE id = ? AND status = ?
                    """, to, actor, id, from);
        }
        if ("payout".equals(column)) {
            return jdbc.update("""
                    UPDATE monthly_settlements
                    SET status = ?, payout_recorded_by = ?, payout_recorded_at = NOW(), updated_at = NOW()
                    WHERE id = ? AND status = ?
                    """, to, actor, id, from);
        }
        return jdbc.update("""
                UPDATE monthly_settlements SET status = ?, updated_at = NOW()
                WHERE id = ? AND status = ?
                """, to, id, from);
    }

    public void recordPayoutNote(UUID id, String note) {
        jdbc.update("UPDATE monthly_settlements SET payout_note = ?, updated_at = NOW() WHERE id = ?", note, id);
    }

    public void insertAdjustment(UUID id, UUID settlementId, String reason, Long delta, UUID actor) {
        jdbc.update("""
                INSERT INTO settlement_adjustments (id, settlement_id, reason, delta_base_usd, actor_id)
                VALUES (?, ?, ?, ?, ?)
                """, id, settlementId, reason, delta, actor);
    }

    public int adjustmentCount(UUID settlementId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM settlement_adjustments WHERE settlement_id = ?",
                Integer.class, settlementId);
        return count == null ? 0 : count;
    }

    public List<SettlementRow> listSettlements(String country, String period, String status) {
        String sql = "SELECT * FROM monthly_settlements WHERE 1 = 1";
        List<Object> args = new ArrayList<>();
        if (country != null) {
            sql += " AND country_code = ?";
            args.add(country);
        }
        if (period != null) {
            sql += " AND period_key = ?";
            args.add(period);
        }
        if (status != null) {
            sql += " AND status = ?";
            args.add(status);
        }
        sql += " ORDER BY period_key, country_code";
        return jdbc.query(sql, (rs, n) -> mapSettlement(rs), args.toArray());
    }

    private Optional<AttributionInsert> one(String sql, UUID paymentOrderId) {
        List<AttributionInsert> rows = jdbc.query(sql, (rs, n) -> mapAttr(rs), paymentOrderId);
        return rows.stream().findFirst();
    }

    private static AttributionInsert mapAttr(java.sql.ResultSet rs) throws java.sql.SQLException {
        String country = rs.getString("attributed_country");
        return new AttributionInsert(
                rs.getObject("id", UUID.class),
                rs.getObject("credit_transaction_id", UUID.class),
                rs.getObject("payment_order_id", UUID.class),
                rs.getString("line_kind"),
                rs.getString("recognition"),
                rs.getObject("crm_agency_id", UUID.class),
                rs.getObject("branch_id", UUID.class),
                country == null ? null : country.trim(),
                rs.getObject("audition_id", UUID.class),
                rs.getObject("application_id", UUID.class),
                rs.getTimestamp("occurred_at").toInstant(),
                (Long) rs.getObject("applied_fee_usd"),
                (Long) rs.getObject("collected_usd"),
                rs.getString("payment_status"),
                rs.getString("refund_status"),
                rs.getObject("contract_id", UUID.class),
                rs.getObject("contract_version_id", UUID.class),
                rs.getString("cash_mapping_policy"),
                rs.getString("confirmation_state"),
                rs.getString("note"));
    }

    private static SettlementRow mapSettlement(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new SettlementRow(
                rs.getObject("id", UUID.class),
                rs.getString("country_code").trim(),
                rs.getObject("contract_id", UUID.class),
                rs.getString("period_key").trim(),
                rs.getString("status"),
                (Long) rs.getObject("target_revenue_usd"),
                (Long) rs.getObject("refunds_usd"),
                (Long) rs.getObject("payment_fees_usd"),
                (Long) rs.getObject("extra_deductions_usd"),
                (Long) rs.getObject("settlement_base_usd"),
                (Long) rs.getObject("compensation_usd"),
                (Long) rs.getObject("hq_share_usd"),
                (Integer) rs.getObject("rate_bps"),
                rs.getString("settlement_basis"),
                rs.getString("rounding_policy"),
                rs.getString("note"),
                rs.getString("payout_note"));
    }

    public record ApplyUse(UUID id, UUID userId, String referenceId, Instant createdAt, Long appliedFeeUsd, String applicantCountry) {
    }

    public record AuditionRef(UUID id, UUID ownerId, UUID postingBranchId) {
    }

    public record PaidOrder(UUID id, long amount, String currency, String status, Instant occurredAt) {
    }

    public record AttributionInsert(
            UUID id,
            UUID creditTransactionId,
            UUID paymentOrderId,
            String lineKind,
            String recognition,
            UUID agencyId,
            UUID branchId,
            String country,
            UUID auditionId,
            UUID applicationId,
            Instant occurredAt,
            Long appliedFeeUsd,
            Long collectedUsd,
            String paymentStatus,
            String refundStatus,
            UUID contractId,
            UUID contractVersionId,
            String cashMappingPolicy,
            String confirmationState,
            String note) {
    }

    public record SettlementRow(
            UUID id,
            String countryCode,
            UUID contractId,
            String periodKey,
            String status,
            Long targetRevenueUsd,
            Long refundsUsd,
            Long paymentFeesUsd,
            Long extraDeductionsUsd,
            Long settlementBaseUsd,
            Long compensationUsd,
            Long hqShareUsd,
            Integer rateBps,
            String settlementBasis,
            String roundingPolicy,
            String note,
            String payoutNote) {
    }
}
