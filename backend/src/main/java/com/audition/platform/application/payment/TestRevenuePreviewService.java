package com.audition.platform.application.payment;

import com.audition.platform.application.org.JdbcContractStore;
import com.audition.platform.application.org.JdbcContractStore.ContractRow;
import com.audition.platform.application.org.JdbcContractStore.VersionRow;
import com.audition.platform.application.org.JdbcCreditLotStore;
import com.audition.platform.application.org.OrgAccess;
import com.audition.platform.application.org.OrgRoles;
import com.audition.platform.application.org.SettlementMath;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * MOCK/TEST 사용분의 국가 분배 미리보기. 운영 월 정산 행에는 쓰지 않는다.
 */
@Service
public class TestRevenuePreviewService {

    private final JdbcCreditLotStore lots;
    private final JdbcContractStore contracts;
    private final OrgAccess access;

    public TestRevenuePreviewService(JdbcCreditLotStore lots, JdbcContractStore contracts, OrgAccess access) {
        this.lots = lots;
        this.contracts = contracts;
        this.access = access;
    }

    @Transactional
    public Map<String, Object> preview(String country, UUID contractId, Instant from, Instant to) {
        lots.rebuild();
        OrgAccess.Actor actor = access.requireCountry(country);
        if (OrgRoles.countryStaff(actor.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "STAFF_PERMISSION_DENIED");
        }
        ContractRow contract = contracts.find(contractId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));
        if (!contract.countryCode().equalsIgnoreCase(country.trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "COUNTRY_SCOPE_DENIED");
        }
        LocalDate end = to.atZone(ZoneOffset.UTC).toLocalDate().minusDays(1);
        VersionRow version = contracts.versions(contractId).stream()
                .filter(row -> !row.start().isAfter(end) && (row.end() == null || !row.end().isBefore(end)))
                .max(java.util.Comparator.comparingInt(VersionRow::versionNo))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "NO_CONTRACT_VERSION"));
        long target = lots.testPayableUsd(contractId, from, to);
        SettlementMath.Result math = SettlementMath.compute(new SettlementMath.Terms(
                version.rateBps(), version.basis(), version.roundingPolicy(),
                version.refundDeductionBasis(), version.paymentFeeDeductionBasis(), version.paymentFeeUsd(),
                version.extraDeductionBasis(), version.extraDeductionUsd()),
                BigDecimal.valueOf(target), BigDecimal.ZERO);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("label", "TEST");
        body.put("excludedFromLivePayout", true);
        body.put("country", contract.countryCode());
        body.put("contractId", contract.id().toString());
        body.put("rateBps", version.rateBps());
        body.put("targetUsd", target);
        body.put("status", math.status());
        body.put("compensation", math.compensation() == null ? null : math.compensation().settled().toPlainString());
        body.put("hqShare", math.hq() == null ? null : math.hq().settled().toPlainString());
        body.put("note", math.note());
        return body;
    }
}
