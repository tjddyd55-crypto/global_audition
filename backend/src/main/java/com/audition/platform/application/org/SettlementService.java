package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import com.audition.platform.application.org.JdbcSettlementStore.SettlementRow;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 확정 정산의 금액 컬럼은 바꾸지 않는다. 지급은 기록만 하며 계좌 이체를 호출하지 않는다.
 */
@Service
public class SettlementService {

    private static final Set<String> FROZEN = Set.of("UNDER_REVIEW", "APPROVED", "PAID", "ADJUSTMENT_REQUIRED");

    private final JdbcSettlementStore store;
    private final JdbcCreditLotStore lots;
    private final JdbcContractStore contracts;
    private final JdbcOrgStore org;
    private final OrgAccess access;

    public SettlementService(
            JdbcSettlementStore store,
            JdbcCreditLotStore lots,
            JdbcContractStore contracts,
            JdbcOrgStore org,
            OrgAccess access) {
        this.store = store;
        this.lots = lots;
        this.contracts = contracts;
        this.org = org;
        this.access = access;
    }

    @Transactional
    public SettlementView calculate(String rawCountry, UUID contractId, String period) {
        String country = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(country);
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        YearMonth month = parse(period);
        ContractRow contract = contracts.find(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
        if (!contract.countryCode().equals(country)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTRY_SCOPE_DENIED");
        }
        SettlementRow existing = store.findSettlement(country, contractId, month.toString()).orElse(null);
        if (existing != null && FROZEN.contains(existing.status())) {
            return view(existing);
        }
        lots.rebuild();
        SettlementRow computed = compute(existing == null ? UUID.randomUUID() : existing.id(), contract, month);
        if (existing == null) {
            try {
                store.insertSettlement(computed);
                store.replaceLines(computed.id(), lineIds(computed, contract.id(), month));
                return view(store.findSettlementById(computed.id()).orElseThrow());
            } catch (DataIntegrityViolationException ex) {
                existing = store.findSettlement(country, contractId, month.toString())
                        .orElseThrow(() -> ex);
                if (FROZEN.contains(existing.status())) {
                    return view(existing);
                }
            }
        }
        computed = compute(existing.id(), contract, month);
        store.updateSettlement(computed);
        try {
            store.replaceLines(computed.id(), lineIds(computed, contract.id(), month));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DUPLICATE_SETTLEMENT_LINE");
        }
        return view(store.findSettlementById(computed.id()).orElseThrow());
    }

    @Transactional
    public SettlementView submitReview(UUID id) {
        SettlementRow row = require(id);
        OrgAccess.Actor actor = access.requireCountry(row.countryCode());
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        if (store.updateStatus(id, "CALCULATED", "UNDER_REVIEW", actor.id(), "status") != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_TRANSITION_DENIED");
        }
        org.audit(UUID.randomUUID(), "SETTLEMENT_SUBMITTED", actor.id(), row.countryCode(), "SETTLEMENT", id.toString(), null);
        return view(require(id));
    }

    @Transactional
    public SettlementView approve(UUID id) {
        OrgAccess.Actor actor = access.requireHq();
        SettlementRow row = require(id);
        if (store.updateStatus(id, "UNDER_REVIEW", "APPROVED", actor.id(), "approved") != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_TRANSITION_DENIED");
        }
        org.audit(UUID.randomUUID(), "SETTLEMENT_APPROVED", actor.id(), row.countryCode(), "SETTLEMENT", id.toString(), null);
        return view(require(id));
    }

    @Transactional
    public SettlementView recordPayout(UUID id, String note) {
        OrgAccess.Actor actor = access.requireHq();
        if (note == null || note.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAYOUT_NOTE_REQUIRED");
        }
        SettlementRow row = require(id);
        JdbcSettlementStore.FxRow fx = store.findFx(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "FX_NOT_FINALIZED"));
        if (!"FX_RECORDED".equals(fx.status()) || fx.actualPaidAmount() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "FX_NOT_FINALIZED");
        }
        store.recordPayoutNote(id, note.trim());
        if (store.updateStatus(id, "APPROVED", "PAID", actor.id(), "payout") != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_TRANSITION_DENIED");
        }
        org.audit(UUID.randomUUID(), "SETTLEMENT_PAYOUT_RECORDED", actor.id(), row.countryCode(), "SETTLEMENT", id.toString(), note.trim());
        return view(require(id));
    }

    @Transactional
    public SettlementView adjust(UUID id, String reason, Long deltaBaseUsd) {
        OrgAccess.Actor actor = access.requireHq();
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REASON_REQUIRED");
        }
        SettlementRow before = require(id);
        if (!Set.of("APPROVED", "PAID", "ADJUSTMENT_REQUIRED").contains(before.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_NOT_LOCKED");
        }
        store.insertAdjustment(UUID.randomUUID(), id, reason.trim(), deltaBaseUsd, actor.id());
        if (!"ADJUSTMENT_REQUIRED".equals(before.status())) {
            jdbcStatus(id, before.status());
        }
        SettlementRow after = require(id);
        if (!sameMoney(before, after)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_IMMUTABLE");
        }
        org.audit(UUID.randomUUID(), "SETTLEMENT_ADJUSTMENT", actor.id(), before.countryCode(), "SETTLEMENT", id.toString(), reason.trim());
        return view(after);
    }

    @Transactional
    public FxView recordFx(UUID id, FxDraft draft) {
        OrgAccess.Actor actor = access.requireHq();
        SettlementRow row = require(id);
        if (!Set.of("APPROVED", "PAID").contains(row.status()) || row.compensationFigure() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "USD_SETTLEMENT_NOT_FINAL");
        }
        if (draft.payoutCurrency() == null || !draft.payoutCurrency().equals(row.payoutCurrency())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAYOUT_CURRENCY_MISMATCH");
        }
        boolean complete = draft.fxRate() != null && draft.fxRate().signum() > 0
                && draft.rateDate() != null
                && draft.rateSource() != null && !draft.rateSource().isBlank()
                && draft.remittanceFee() != null
                && draft.actualPaidAmount() != null
                && draft.paidDate() != null;
        if ("USD".equals(draft.payoutCurrency()) && complete && draft.fxRate().compareTo(BigDecimal.ONE) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USD_RATE_MUST_BE_ONE");
        }
        JdbcSettlementStore.FxRow existing = store.findFx(id).orElse(null);
        JdbcSettlementStore.FxRow saved = new JdbcSettlementStore.FxRow(
                existing == null ? UUID.randomUUID() : existing.id(),
                id,
                draft.payoutCurrency(),
                draft.fxRate(),
                draft.rateDate(),
                draft.rateSource() == null ? null : draft.rateSource().trim(),
                draft.remittanceFee(),
                complete ? draft.actualPaidAmount() : null,
                draft.paidDate(),
                actor.id(),
                complete ? "FX_RECORDED" : "FX_INCOMPLETE");
        store.upsertFx(saved);
        org.audit(UUID.randomUUID(), "PAYOUT_FX_RECORDED", actor.id(), row.countryCode(), "SETTLEMENT", id.toString(), saved.status());
        return fxView(store.findFx(id).orElseThrow());
    }

    @Transactional
    public SettlementView preview(String rawCountry, UUID contractId, String period) {
        String country = CountryCodes.iso2(rawCountry);
        OrgAccess.Actor actor = access.requireCountry(country);
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        YearMonth month = parse(period);
        ContractRow contract = contracts.find(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
        if (!contract.countryCode().equals(country)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTRY_SCOPE_DENIED");
        }
        lots.rebuild();
        SettlementRow computed = compute(UUID.randomUUID(), contract, month);
        return view(computed, "EXPECTED");
    }

    public Statement statement(UUID id) {
        SettlementRow row = require(id);
        OrgAccess.Actor actor = access.requireCountry(row.countryCode());
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        YearMonth month = parse(row.periodKey());
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        ContractRow contract = contracts.find(row.contractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
        List<StatementLine> lines = lots.agencyUsage(row.contractId(), from, to).stream()
                .map(usage -> new StatementLine(
                        usage.agencyName(), usage.freeCredits(), usage.paidCredits(), usage.payableUsd(), usage.reviewCredits()))
                .toList();
        List<StatementAdjustment> adjustments = store.adjustments(id).stream()
                .map(item -> new StatementAdjustment(item.reason(), item.deltaBaseUsd(), item.createdAt().toString()))
                .toList();
        return new Statement(
                row.countryCode(),
                contract.counterparty(),
                row.periodKey(),
                row.status(),
                row.rateBps(),
                row.settlementBasis(),
                row.targetRevenueUsd(),
                row.refundsUsd(),
                row.paymentFeesUsd(),
                row.extraDeductionsUsd(),
                row.settlementBaseUsd(),
                plain(row.baseFigure(), "settled"),
                plain(row.compensationFigure(), "settled"),
                plain(row.hqFigure(), "settled"),
                row.payoutNote(),
                row.note(),
                lines,
                adjustments);
    }

    public String statementCsv(UUID id) {
        Statement statement = statement(id);
        StringBuilder csv = new StringBuilder();
        csv.append("country,counterparty,period,status,rate_bps,basis,target_usd,refunds_usd,payment_fees_usd,extra_deductions_usd,base_usd,base_final,compensation_final,hq_share_final,payout_note\n");
        csv.append(csvCell(statement.countryCode())).append(',')
                .append(csvCell(statement.counterparty())).append(',')
                .append(csvCell(statement.period())).append(',')
                .append(csvCell(statement.status())).append(',')
                .append(statement.rateBps() == null ? "" : statement.rateBps()).append(',')
                .append(csvCell(statement.basis())).append(',')
                .append(num(statement.targetUsd())).append(',')
                .append(num(statement.refundsUsd())).append(',')
                .append(num(statement.paymentFeesUsd())).append(',')
                .append(num(statement.extraDeductionsUsd())).append(',')
                .append(num(statement.baseUsd())).append(',')
                .append(csvCell(statement.baseFinal())).append(',')
                .append(csvCell(statement.compensationFinal())).append(',')
                .append(csvCell(statement.hqShareFinal())).append(',')
                .append(csvCell(statement.payoutNote())).append('\n');
        csv.append("agency,free_credits,paid_credits,settleable_usd,review_credits\n");
        for (StatementLine line : statement.lines()) {
            csv.append(csvCell(line.agencyName())).append(',')
                    .append(line.freeCredits()).append(',')
                    .append(line.paidCredits()).append(',')
                    .append(line.settleableUsd()).append(',')
                    .append(line.reviewCredits()).append('\n');
        }
        csv.append("adjustment_reason,delta_base_usd,created_at\n");
        for (StatementAdjustment adjustment : statement.adjustments()) {
            csv.append(csvCell(adjustment.reason())).append(',')
                    .append(num(adjustment.deltaBaseUsd())).append(',')
                    .append(csvCell(adjustment.createdAt())).append('\n');
        }
        return csv.toString();
    }

    public List<SettlementView> list(String country, String period, String status) {
        if (country == null || country.isBlank()) {
            access.requireHq();
            return store.listSettlements(null, blank(period), blank(status)).stream().map(this::view).toList();
        }
        String code = CountryCodes.iso2(country);
        OrgAccess.Actor actor = access.requireCountry(code);
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        return store.listSettlements(code, blank(period), blank(status)).stream().map(this::view).toList();
    }

    private void jdbcStatus(UUID id, String from) {
        if (store.updateStatus(id, from, "ADJUSTMENT_REQUIRED", null, "status") != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SETTLEMENT_TRANSITION_DENIED");
        }
    }

    private SettlementRow compute(UUID id, ContractRow contract, YearMonth month) {
        LocalDate periodEnd = month.atEndOfMonth();
        VersionRow version = contracts.versions(contract.id()).stream()
                .filter(row -> AttributionPlanner.covers(new AttributionPlanner.Window(
                        contract.id(), row.id(), row.versionNo(), contract.countryCode(), contract.agencyId(),
                        row.start(), row.end()), periodEnd))
                .max(java.util.Comparator.comparingInt(VersionRow::versionNo))
                .orElse(null);
        if (version == null) {
            return draft(id, contract, month, null, "NO_CONTRACT_VERSION");
        }
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<JdbcCreditLotStore.UsageRow> usages = lots.usages(contract.id(), from, to);
        boolean mixed = usages.stream().anyMatch(row -> row.versionId() != null && !version.id().equals(row.versionId()));
        if (mixed) {
            return draft(id, contract, month, version, "MIXED_CONTRACT_VERSIONS");
        }
        SettlementMath.Terms terms = new SettlementMath.Terms(
                version.rateBps(), version.basis(), version.roundingPolicy(),
                version.refundDeductionBasis(), version.paymentFeeDeductionBasis(), version.paymentFeeUsd(),
                version.extraDeductionBasis(), version.extraDeductionUsd());
        SettlementMath.Result missing = SettlementMath.compute(terms, BigDecimal.ZERO, BigDecimal.ZERO);
        if (!SettlementMath.CALCULATED.equals(missing.status()) && !"NEGATIVE_BASE".equals(missing.note())) {
            return draft(id, contract, month, version, missing.note());
        }
        long excluded = usages.stream().filter(row ->
                CreditAllocation.REVIEW.equals(row.allocationStatus())
                        || CreditAllocation.PENDING.equals(row.allocationStatus())).count();
        long payable = usages.stream()
                .filter(row -> CreditAllocation.ALLOCATED.equals(row.allocationStatus()))
                .mapToLong(row -> row.payableUsd() == null ? 0 : row.payableUsd())
                .sum();
        RefundDecision refunds = SettlementMath.DEDUCTION_NONE.equals(version.refundDeductionBasis())
                ? new RefundDecision(false, 0)
                : refunds(contract.id(), from, to);
        if (refunds.block()) {
            return held(id, contract, month, version, SettlementMath.REFUND_ALLOCATION_PENDING, "REFUND_ALLOCATION_PENDING");
        }
        SettlementMath.Result math = SettlementMath.compute(terms, BigDecimal.valueOf(payable), BigDecimal.valueOf(refunds.deductibleUsd()));
        if (!SettlementMath.CALCULATED.equals(math.status())) {
            return draft(id, contract, month, version, math.note());
        }
        String note = math.note()
                + ";PAYABLE_USAGE_NOT_CASH_COLLECTION"
                + ";EXPERT_REVIEW_REVENUE_RECOGNITION"
                + ";EXPERT_REVIEW_BREAKAGE";
        if (excluded > 0) {
            note = note + ";REVIEW_REQUIRED_EXCLUDED:" + excluded;
        }
        return new SettlementRow(
                id, contract.countryCode(), contract.id(), month.toString(), math.status(),
                payable,
                refunds.deductibleUsd(),
                version.paymentFeeUsd(),
                version.extraDeductionUsd(),
                SettlementMath.wholeDollars(math.base().settled()),
                SettlementMath.wholeDollars(math.compensation().settled()),
                SettlementMath.wholeDollars(math.hq().settled()),
                version.rateBps(), version.basis(), version.roundingPolicy(), note, null,
                version.currency(), math.base(), math.compensation(), math.hq());
    }

    private RefundDecision refunds(UUID contractId, Instant from, Instant to) {
        long deductible = 0;
        boolean block = false;
        for (JdbcCreditLotStore.RefundLink refund : lots.refunds(from, to)) {
            List<JdbcCreditLotStore.PaidUse> uses = lots.paidUses(refund.paymentOrderId());
            boolean touches = uses.stream().anyMatch(use -> contractId.equals(use.contractId()));
            if (!touches) {
                continue;
            }
            long remaining = lots.paidRemaining(refund.paymentOrderId());
            Set<UUID> contracts = new HashSet<>();
            boolean unresolved = remaining > 0;
            for (JdbcCreditLotStore.PaidUse use : uses) {
                if (use.contractId() == null
                        || CreditAllocation.PENDING.equals(use.status())
                        || CreditAllocation.REVIEW.equals(use.status())) {
                    unresolved = true;
                }
                if (use.contractId() != null) {
                    contracts.add(use.contractId());
                }
            }
            if (unresolved || contracts.size() != 1) {
                block = true;
                continue;
            }
            long payable = uses.stream().mapToLong(use -> use.payableUsd() == null ? 0 : use.payableUsd()).sum();
            deductible += Math.min(refund.amountUsd(), payable);
        }
        return new RefundDecision(block, deductible);
    }

    private List<UUID> lineIds(SettlementRow row, UUID contractId, YearMonth month) {
        if (!SettlementMath.CALCULATED.equals(row.status())) {
            return List.of();
        }
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<UUID> ids = new ArrayList<>();
        for (JdbcCreditLotStore.UsageRow usage : lots.usages(contractId, from, to)) {
            if (CreditAllocation.ALLOCATED.equals(usage.allocationStatus()) && usage.payableUsd() != null && usage.payableUsd() > 0) {
                ids.add(usage.attributionId());
            }
        }
        return ids;
    }

    private static SettlementRow draft(UUID id, ContractRow contract, YearMonth month, VersionRow version, String note) {
        return held(id, contract, month, version, SettlementMath.NEEDS_CONFIRMATION, note);
    }

    private static SettlementRow held(UUID id, ContractRow contract, YearMonth month, VersionRow version, String status, String note) {
        return new SettlementRow(
                id, contract.countryCode(), contract.id(), month.toString(), status,
                null, null, null, null, null, null, null,
                version == null ? null : version.rateBps(),
                version == null ? null : version.basis(),
                version == null ? null : version.roundingPolicy(),
                note, null,
                version == null ? null : version.currency(),
                null, null, null);
    }

    private SettlementRow require(UUID id) {
        return store.findSettlementById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SETTLEMENT_NOT_FOUND"));
    }

    private SettlementView view(SettlementRow row) {
        return view(row, "STORED");
    }

    private SettlementView view(SettlementRow row, String figureKind) {
        return new SettlementView(
                row.id(), row.countryCode(), row.contractId(), row.periodKey(), row.status(),
                row.targetRevenueUsd(), row.refundsUsd(), row.paymentFeesUsd(), row.extraDeductionsUsd(),
                row.settlementBaseUsd(), row.compensationUsd(), row.hqShareUsd(),
                row.rateBps(), row.settlementBasis(), row.roundingPolicy(), row.note(), row.payoutNote(),
                row.payoutCurrency(),
                plain(row.baseFigure(), "raw"), plain(row.baseFigure(), "settled"), plain(row.baseFigure(), "diff"),
                plain(row.compensationFigure(), "raw"), plain(row.compensationFigure(), "settled"), plain(row.compensationFigure(), "diff"),
                plain(row.hqFigure(), "raw"), plain(row.hqFigure(), "settled"), plain(row.hqFigure(), "diff"),
                figureKind);
    }

    private static FxView fxView(JdbcSettlementStore.FxRow row) {
        return new FxView(
                row.id(), row.settlementId(), row.payoutCurrency(),
                row.fxRate() == null ? null : row.fxRate().toPlainString(),
                row.rateDate() == null ? null : row.rateDate().toString(),
                row.rateSource(),
                row.remittanceFee() == null ? null : row.remittanceFee().toPlainString(),
                row.actualPaidAmount() == null ? null : row.actualPaidAmount().toPlainString(),
                row.paidDate() == null ? null : row.paidDate().toString(),
                row.status());
    }

    private static String plain(SettlementMath.Figure figure, String part) {
        if (figure == null) {
            return null;
        }
        BigDecimal value = switch (part) {
            case "raw" -> figure.raw();
            case "diff" -> figure.difference();
            default -> figure.settled();
        };
        return value == null ? null : value.toPlainString();
    }

    private static boolean sameMoney(SettlementRow left, SettlementRow right) {
        return eq(left.settlementBaseUsd(), right.settlementBaseUsd())
                && eq(left.compensationUsd(), right.compensationUsd())
                && eq(left.hqShareUsd(), right.hqShareUsd())
                && eq(left.targetRevenueUsd(), right.targetRevenueUsd())
                && java.util.Objects.equals(plain(left.compensationFigure(), "settled"), plain(right.compensationFigure(), "settled"));
    }

    private static boolean eq(Long left, Long right) {
        return left == null ? right == null : left.equals(right);
    }

    private static YearMonth parse(String period) {
        try {
            return YearMonth.parse(period);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PERIOD_INVALID");
        }
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String num(Long value) {
        return value == null ? "" : value.toString();
    }

    private static String csvCell(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    public record SettlementView(
            UUID id,
            String countryCode,
            UUID contractId,
            String period,
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
            String payoutNote,
            String payoutCurrency,
            String settlementBaseRaw,
            String settlementBaseFinal,
            String settlementBaseDiff,
            String compensationRaw,
            String compensationFinal,
            String compensationDiff,
            String hqShareRaw,
            String hqShareFinal,
            String hqShareDiff,
            String figureKind) {
    }

    public record Statement(
            String countryCode,
            String counterparty,
            String period,
            String status,
            Integer rateBps,
            String basis,
            Long targetUsd,
            Long refundsUsd,
            Long paymentFeesUsd,
            Long extraDeductionsUsd,
            Long baseUsd,
            String baseFinal,
            String compensationFinal,
            String hqShareFinal,
            String payoutNote,
            String note,
            List<StatementLine> lines,
            List<StatementAdjustment> adjustments) {
    }

    public record StatementLine(String agencyName, long freeCredits, long paidCredits, long settleableUsd, long reviewCredits) {
    }

    public record StatementAdjustment(String reason, Long deltaBaseUsd, String createdAt) {
    }

    public record FxDraft(
            String payoutCurrency,
            BigDecimal fxRate,
            LocalDate rateDate,
            String rateSource,
            BigDecimal remittanceFee,
            BigDecimal actualPaidAmount,
            LocalDate paidDate) {
    }

    public record FxView(
            UUID id,
            UUID settlementId,
            String payoutCurrency,
            String fxRate,
            String rateDate,
            String rateSource,
            String remittanceFee,
            String actualPaidAmount,
            String paidDate,
            String status) {
    }

    private record RefundDecision(boolean block, long deductibleUsd) {
    }
}
