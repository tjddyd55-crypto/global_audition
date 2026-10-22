package com.audition.platform.api;

import com.audition.platform.application.org.AttributionService;
import com.audition.platform.application.org.JdbcSettlementStore.AttributionInsert;
import com.audition.platform.application.org.SettlementService;
import com.audition.platform.application.org.SettlementService.SettlementView;
import com.audition.platform.application.org.StatsService;
import com.audition.platform.application.org.StatsService.CountryDetail;
import com.audition.platform.application.org.StatsService.GlobalStats;
import com.audition.platform.application.org.StatsService.Policy;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/org")
public class OrgFinanceController {

    private final AttributionService attributions;
    private final SettlementService settlements;
    private final StatsService stats;

    public OrgFinanceController(AttributionService attributions, SettlementService settlements, StatsService stats) {
        this.attributions = attributions;
        this.settlements = settlements;
        this.stats = stats;
    }

    @GetMapping("/policy")
    public Policy policy() {
        return stats.policy();
    }

    @PostMapping("/attributions/reconcile")
    public ReconcileResponse reconcile() {
        return new ReconcileResponse(attributions.reconcileApplyUses());
    }

    @PostMapping("/attributions/cash-links")
    public AttributionInsert linkCash(@RequestBody CashLinkRequest request) {
        return attributions.linkCash(request.paymentOrderId(), request.contractId());
    }

    @PostMapping("/attributions/refunds")
    public AttributionInsert refund(@RequestBody RefundRequest request) {
        return attributions.recordRefund(request.paymentOrderId(), request.amountUsd(), request.reason());
    }

    @GetMapping("/settlements")
    public List<SettlementView> settlements(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String status) {
        return settlements.list(country, period, status);
    }

    @PostMapping("/settlements/calculate")
    public SettlementView calculate(@RequestBody CalculateRequest request) {
        return settlements.calculate(request.countryCode(), request.contractId(), request.period());
    }

    @PostMapping("/settlements/{id}/review")
    public SettlementView review(@PathVariable UUID id) {
        return settlements.submitReview(id);
    }

    @PostMapping("/settlements/{id}/approve")
    public SettlementView approve(@PathVariable UUID id) {
        return settlements.approve(id);
    }

    @PostMapping("/settlements/{id}/payout")
    public SettlementView payout(@PathVariable UUID id, @RequestBody PayoutRequest request) {
        return settlements.recordPayout(id, request.note());
    }

    @PostMapping("/settlements/{id}/adjustments")
    public SettlementView adjust(@PathVariable UUID id, @RequestBody AdjustmentRequest request) {
        return settlements.adjust(id, request.reason(), request.deltaBaseUsd());
    }

    @GetMapping("/stats/global")
    public GlobalStats global(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String period) {
        return stats.global(country, period);
    }

    @GetMapping("/stats/country")
    public CountryDetail country(
            @RequestParam String country,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) UUID agencyId,
            @RequestParam(required = false) UUID staffUserId,
            @RequestParam(required = false) UUID contractId,
            @RequestParam(required = false) UUID auditionId,
            @RequestParam(required = false) String settlementStatus) {
        return stats.country(country, period, agencyId, staffUserId, contractId, auditionId, settlementStatus);
    }

    public record ReconcileResponse(int inserted) {
    }

    public record CashLinkRequest(UUID paymentOrderId, UUID contractId) {
    }

    public record RefundRequest(UUID paymentOrderId, long amountUsd, String reason) {
    }

    public record CalculateRequest(String countryCode, UUID contractId, String period) {
    }

    public record PayoutRequest(String note) {
    }

    public record AdjustmentRequest(String reason, Long deltaBaseUsd) {
    }
}
