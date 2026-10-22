package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import com.audition.platform.application.org.JdbcSettlementStore.AttributionInsert;
import com.audition.platform.application.org.JdbcSettlementStore.SettlementRow;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
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
    private final JdbcContractStore contracts;
    private final JdbcOrgStore org;
    private final OrgAccess access;

    public SettlementService(
            JdbcSettlementStore store,
            JdbcContractStore contracts,
            JdbcOrgStore org,
            OrgAccess access) {
        this.store = store;
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
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<AttributionInsert> rows = store.attributionsForContract(contract.id(), from, to);
        boolean sales = rows.stream().anyMatch(row -> AttributionPlanner.SALES.equals(row.recognition()));
        List<AttributionInsert> cash = rows.stream()
                .filter(row -> AttributionPlanner.ACCOUNTING.equals(row.recognition()))
                .filter(row -> AttributionPlanner.ATTRIBUTED.equals(row.confirmationState()))
                .toList();
        if (version == null) {
            return draft(id, contract, month, null, "NO_CONTRACT_VERSION");
        }
        boolean mixed = cash.stream().anyMatch(row -> !version.id().equals(row.contractVersionId()));
        if (mixed) {
            return draft(id, contract, month, version, "MIXED_CONTRACT_VERSIONS");
        }
        if (sales && cash.isEmpty()) {
            return draft(id, contract, month, version, "CASH_MAPPING_UNDECIDED");
        }
        long target = cash.stream().filter(row -> "REVENUE".equals(row.lineKind())).mapToLong(row -> row.collectedUsd() == null ? 0 : row.collectedUsd()).sum();
        long refunds = cash.stream().filter(row -> "REFUND".equals(row.lineKind())).mapToLong(row -> row.collectedUsd() == null ? 0 : row.collectedUsd()).sum();
        SettlementMath.Result math = SettlementMath.compute(
                target, refunds, version.paymentFeeUsd(), version.extraDeductionUsd(),
                version.rateBps(), version.basis(), version.roundingPolicy());
        String note = math.note();
        if (sales) {
            note = note + ";SALES_EXCLUDED_CASH_MAPPING_UNDECIDED";
        }
        return new SettlementRow(
                id, contract.countryCode(), contract.id(), month.toString(), math.status(),
                math.baseUsd() == null ? null : target,
                math.baseUsd() == null ? null : refunds,
                math.baseUsd() == null ? null : version.paymentFeeUsd(),
                math.baseUsd() == null ? null : version.extraDeductionUsd(),
                math.baseUsd(), math.compensationUsd(), math.hqShareUsd(),
                version.rateBps(), version.basis(), version.roundingPolicy(), note, null);
    }

    private List<UUID> lineIds(SettlementRow row, UUID contractId, YearMonth month) {
        if (!SettlementMath.CALCULATED.equals(row.status())) {
            return List.of();
        }
        Instant from = month.atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<UUID> ids = new ArrayList<>();
        for (AttributionInsert attribution : store.attributionsForContract(contractId, from, to)) {
            if (AttributionPlanner.ACCOUNTING.equals(attribution.recognition())
                    && AttributionPlanner.ATTRIBUTED.equals(attribution.confirmationState())) {
                ids.add(attribution.id());
            }
        }
        return ids;
    }

    private static SettlementRow draft(UUID id, ContractRow contract, YearMonth month, VersionRow version, String note) {
        return new SettlementRow(
                id, contract.countryCode(), contract.id(), month.toString(), SettlementMath.NEEDS_CONFIRMATION,
                null, null, null, null, null, null, null,
                version == null ? null : version.rateBps(),
                version == null ? null : version.basis(),
                version == null ? null : version.roundingPolicy(),
                note, null);
    }

    private SettlementRow require(UUID id) {
        return store.findSettlementById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SETTLEMENT_NOT_FOUND"));
    }

    private SettlementView view(SettlementRow row) {
        return new SettlementView(
                row.id(), row.countryCode(), row.contractId(), row.periodKey(), row.status(),
                row.targetRevenueUsd(), row.refundsUsd(), row.paymentFeesUsd(), row.extraDeductionsUsd(),
                row.settlementBaseUsd(), row.compensationUsd(), row.hqShareUsd(),
                row.rateBps(), row.settlementBasis(), row.roundingPolicy(), row.note(), row.payoutNote());
    }

    private static boolean sameMoney(SettlementRow left, SettlementRow right) {
        return eq(left.settlementBaseUsd(), right.settlementBaseUsd())
                && eq(left.compensationUsd(), right.compensationUsd())
                && eq(left.hqShareUsd(), right.hqShareUsd())
                && eq(left.targetRevenueUsd(), right.targetRevenueUsd());
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
            String payoutNote) {
    }
}
