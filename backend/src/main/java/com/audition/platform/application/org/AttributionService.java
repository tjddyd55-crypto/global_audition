package com.audition.platform.application.org;

import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import com.audition.platform.application.org.JdbcSettlementStore.ApplyUse;
import com.audition.platform.application.org.JdbcSettlementStore.AttributionInsert;
import com.audition.platform.application.org.JdbcSettlementStore.AuditionRef;
import com.audition.platform.application.org.JdbcSettlementStore.PaidOrder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

/**
 * 원장 행을 고치지 않고 귀속 스냅샷만 추가한다. 크레딧 사용액을 현금으로 복사하지 않는다.
 */
@Service
public class AttributionService {

    private final JdbcSettlementStore store;
    private final JdbcContractStore contracts;
    private final JdbcOrgStore org;
    private final OrgAccess access;

    public AttributionService(
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
    public int reconcileApplyUses() {
        OrgAccess.Actor actor = access.requireHq();
        int inserted = 0;
        for (ApplyUse use : store.unattributedApplyUses()) {
            if (insertUse(use)) {
                inserted++;
            }
        }
        org.audit(UUID.randomUUID(), "ATTRIBUTION_RECONCILED", actor.id(), null, "LEDGER", null, "inserted=" + inserted);
        return inserted;
    }

    @Transactional
    public AttributionInsert linkCash(UUID paymentOrderId, UUID contractId) {
        OrgAccess.Actor actor = access.requireHq();
        PaidOrder order = store.payment(paymentOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND"));
        if (!"PAID".equals(order.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "PAYMENT_NOT_COLLECTED");
        }
        ContractRow contract = contracts.find(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
        LocalDate day = order.occurredAt().atZone(ZoneOffset.UTC).toLocalDate();
        VersionRow version = covering(contractId, day);
        boolean usd = order.currency() != null && "USD".equalsIgnoreCase(order.currency().trim());
        AttributionInsert row = new AttributionInsert(
                UUID.randomUUID(),
                null,
                order.id(),
                "REVENUE",
                AttributionPlanner.ACCOUNTING,
                contract.agencyId(),
                contract.agencyId(),
                usd && version != null ? contract.countryCode() : null,
                null,
                null,
                order.occurredAt(),
                null,
                usd && version != null ? order.amount() : null,
                order.status(),
                null,
                usd && version != null ? contract.id() : null,
                usd && version != null ? version.id() : null,
                usd && version != null ? AttributionPlanner.CASH_MAPPING_COLLECTED : AttributionPlanner.CASH_MAPPING_UNDECIDED,
                usd && version != null ? AttributionPlanner.ATTRIBUTED : AttributionPlanner.NEEDS_CONFIRMATION,
                usd ? (version == null ? "NO_CONTRACT_VERSION" : "PAYMENT_AMOUNT_COPIED") : "FX_UNDECIDED");
        try {
            store.insertAttribution(row);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DUPLICATE_ATTRIBUTION");
        }
        org.audit(UUID.randomUUID(), "CASH_LINKED", actor.id(), contract.countryCode(), "PAYMENT_ORDER", order.id().toString(), row.note());
        return row;
    }

    @Transactional
    public AttributionInsert recordRefund(UUID paymentOrderId, long amountUsd, String reason) {
        OrgAccess.Actor actor = access.requireHq();
        if (amountUsd < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REFUND_AMOUNT_INVALID");
        }
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REASON_REQUIRED");
        }
        AttributionInsert revenue = store.revenueLink(paymentOrderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "CASH_LINK_REQUIRED"));
        if (revenue.collectedUsd() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CASH_LINK_REQUIRED");
        }
        long already = store.refundedUsd(paymentOrderId);
        if (already + amountUsd > revenue.collectedUsd()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "REFUND_EXCEEDS_COLLECTION");
        }
        AttributionInsert row = new AttributionInsert(
                UUID.randomUUID(), null, paymentOrderId, "REFUND", AttributionPlanner.ACCOUNTING,
                revenue.agencyId(), revenue.branchId(), revenue.country(), revenue.auditionId(), revenue.applicationId(),
                revenue.occurredAt(), null, amountUsd, revenue.paymentStatus(), "REFUNDED",
                revenue.contractId(), revenue.contractVersionId(), AttributionPlanner.CASH_MAPPING_COLLECTED,
                AttributionPlanner.ATTRIBUTED, reason.trim());
        store.insertAttribution(row);
        org.audit(UUID.randomUUID(), "REFUND_RECORDED", actor.id(), revenue.country(), "PAYMENT_ORDER", paymentOrderId.toString(), reason);
        return row;
    }

    private boolean insertUse(ApplyUse use) {
        UUID auditionId = parseUuid(use.referenceId());
        AuditionRef audition = auditionId == null ? null : store.audition(auditionId).orElse(null);
        UUID applicationId = audition == null ? null : store.applicationId(audition.id(), use.userId()).orElse(null);
        UUID branchId = audition == null ? null : audition.postingBranchId();
        List<UUID> branches = branchId != null
                ? List.of(branchId)
                : (audition == null ? List.of() : store.approvedBranchesForOwner(audition.ownerId()));
        List<AttributionPlanner.Window> windows = contracts.windowsForBranches(branches);
        LocalDate day = use.createdAt().atZone(ZoneOffset.UTC).toLocalDate();
        AttributionPlanner.Plan plan = AttributionPlanner.plan(new AttributionPlanner.Input(
                AttributionPlanner.SALES,
                branchId,
                use.applicantCountry(),
                day,
                null,
                windows));
        UUID agencyId = plan.contractId() == null ? branchId : contracts.find(plan.contractId()).map(ContractRow::agencyId).orElse(branchId);
        AttributionInsert row = new AttributionInsert(
                UUID.randomUUID(),
                use.id(),
                null,
                "REVENUE",
                AttributionPlanner.SALES,
                agencyId,
                branchId == null && branches.size() == 1 ? branches.get(0) : branchId,
                plan.attributedCountry(),
                auditionId,
                applicationId,
                use.createdAt(),
                use.appliedFeeUsd(),
                plan.collectedUsd(),
                null,
                null,
                plan.contractId(),
                plan.contractVersionId(),
                plan.cashMappingPolicy(),
                plan.confirmationState(),
                plan.note());
        try {
            store.insertAttribution(row);
            return true;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    private VersionRow covering(UUID contractId, LocalDate day) {
        return contracts.versions(contractId).stream()
                .filter(version -> AttributionPlanner.covers(new AttributionPlanner.Window(
                        contractId, version.id(), version.versionNo(), "", null, version.start(), version.end()), day))
                .max(java.util.Comparator.comparingInt(VersionRow::versionNo))
                .orElse(null);
    }

    private static UUID parseUuid(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
