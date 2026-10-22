package com.audition.platform.application.fee;

import com.audition.platform.api.dto.ApplicationFeeHistoryView;
import com.audition.platform.api.dto.ApplicationFeeView;
import com.audition.platform.application.credit.CreditPolicyKey;
import com.audition.platform.application.credit.UsdCreditParity;
import com.audition.platform.application.credit.CreditPolicyPublicSnapshotCache;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import com.audition.platform.domain.fee.PlatformApplicationFee;
import com.audition.platform.domain.fee.PlatformApplicationFeeHistory;
import com.audition.platform.domain.fee.PlatformApplicationFeeHistoryRepository;
import com.audition.platform.domain.fee.PlatformApplicationFeeRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GlobalApplicationFeeService {

    public static final String SOURCE_ADMIN = "ADMIN_FEE";
    public static final String SOURCE_CREDIT_POLICY = "CREDIT_POLICY_PATCH";

    private final PlatformApplicationFeeRepository feeRepository;
    private final PlatformApplicationFeeHistoryRepository historyRepository;
    private final CreditPolicyRepository creditPolicyRepository;
    private final CreditPolicyPublicSnapshotCache snapshotCache;

    public GlobalApplicationFeeService(
            PlatformApplicationFeeRepository feeRepository,
            PlatformApplicationFeeHistoryRepository historyRepository,
            CreditPolicyRepository creditPolicyRepository,
            CreditPolicyPublicSnapshotCache snapshotCache) {
        this.feeRepository = feeRepository;
        this.historyRepository = historyRepository;
        this.creditPolicyRepository = creditPolicyRepository;
        this.snapshotCache = snapshotCache;
    }

    @Transactional(readOnly = true)
    public long currentAmountUsd() {
        return feeRepository.findById(PlatformApplicationFee.SINGLETON_ID)
                .map(PlatformApplicationFee::getAmountUsd)
                .orElse(0L);
    }

    @Transactional(readOnly = true)
    public ApplicationFeeView view() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return toView(loadOrEmpty());
    }

    @Transactional(readOnly = true)
    public List<ApplicationFeeHistoryView> history() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return historyRepository.findTop20ByOrderByChangedAtDesc().stream()
                .map(GlobalApplicationFeeService::toHistoryView)
                .toList();
    }

    @Transactional
    public ApplicationFeeView update(BigDecimal amountUsd) {
        SuperAdminAuthHelper.requireSuperAdmin();
        long next = requireWholeUsd(amountUsd);
        return replace(next, SecurityUtils.getCurrentUserId(), SOURCE_ADMIN);
    }

    /**
     * 기존 크레딧 정책 화면의 AUDITION_APPLY 수정은 전역 USD 수수료로 합친다.
     * 비활성 또는 0 이하는 0(FREE). 과거 원장 금액은 바꾸지 않는다.
     */
    @Transactional
    public ApplicationFeeView replaceFromCreditPolicy(long cost, boolean active, UUID actorId) {
        SuperAdminAuthHelper.requireSuperAdmin();
        long effective = active && cost > 0 ? cost : 0;
        if (effective > PlatformApplicationFee.MAX_USD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원비는 0 이상 10000 이하 정수 USD입니다.");
        }
        return replace(effective, actorId, SOURCE_CREDIT_POLICY);
    }

    public static long requireWholeUsd(BigDecimal raw) {
        if (raw == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amountUsd가 필요합니다.");
        }
        if (raw.stripTrailingZeros().scale() > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원비는 정수 USD만 허용합니다.");
        }
        long value;
        try {
            value = raw.stripTrailingZeros().longValueExact();
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원비는 정수 USD만 허용합니다.");
        }
        if (value < 0 || value > PlatformApplicationFee.MAX_USD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원비는 0 이상 10000 이하 정수 USD입니다.");
        }
        return value;
    }

    private ApplicationFeeView replace(long next, UUID actorId, String source) {
        PlatformApplicationFee row = loadOrCreate();
        long previous = row.getAmountUsd();
        if (previous != next) {
            historyRepository.save(history(previous, next, actorId, source));
        }
        row.setAmountUsd(next);
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(actorId);
        feeRepository.save(row);
        mirrorCreditPolicy(next);
        snapshotCache.invalidate(CreditPolicyKey.AUDITION_APPLY);
        return toView(row);
    }

    private void mirrorCreditPolicy(long amountUsd) {
        CreditPolicy policy = creditPolicyRepository.findById(CreditPolicyKey.AUDITION_APPLY).orElseGet(() -> {
            CreditPolicy created = new CreditPolicy();
            created.setPolicyKey(CreditPolicyKey.AUDITION_APPLY);
            return created;
        });
        policy.setCost(UsdCreditParity.creditsForUsd(amountUsd));
        policy.setActive(amountUsd > 0);
        policy.setUpdatedAt(Instant.now());
        creditPolicyRepository.save(policy);
    }

    private PlatformApplicationFee loadOrCreate() {
        return feeRepository.findById(PlatformApplicationFee.SINGLETON_ID).orElseGet(() -> {
            PlatformApplicationFee created = new PlatformApplicationFee();
            created.setId(PlatformApplicationFee.SINGLETON_ID);
            created.setAmountUsd(0);
            created.setUpdatedAt(Instant.now());
            return feeRepository.save(created);
        });
    }

    private PlatformApplicationFee loadOrEmpty() {
        return feeRepository.findById(PlatformApplicationFee.SINGLETON_ID).orElseGet(() -> {
            PlatformApplicationFee empty = new PlatformApplicationFee();
            empty.setId(PlatformApplicationFee.SINGLETON_ID);
            empty.setAmountUsd(0);
            return empty;
        });
    }

    private static PlatformApplicationFeeHistory history(long previous, long next, UUID actorId, String source) {
        PlatformApplicationFeeHistory row = new PlatformApplicationFeeHistory();
        row.setId(UUID.randomUUID());
        row.setOldAmountUsd(previous);
        row.setNewAmountUsd(next);
        row.setChangedBy(actorId);
        row.setChangedAt(Instant.now());
        row.setSource(source);
        return row;
    }

    private static ApplicationFeeView toView(PlatformApplicationFee row) {
        ApplicationFeeView view = new ApplicationFeeView();
        view.setAmountUsd(row.getAmountUsd());
        view.setCreditQuantity(UsdCreditParity.creditsForUsd(row.getAmountUsd()));
        view.setUpdatedAt(row.getUpdatedAt());
        view.setUpdatedBy(row.getUpdatedBy());
        return view;
    }

    private static ApplicationFeeHistoryView toHistoryView(PlatformApplicationFeeHistory row) {
        ApplicationFeeHistoryView view = new ApplicationFeeHistoryView();
        view.setId(row.getId());
        view.setOldAmountUsd(row.getOldAmountUsd());
        view.setNewAmountUsd(row.getNewAmountUsd());
        view.setChangedBy(row.getChangedBy());
        view.setChangedAt(row.getChangedAt());
        view.setSource(row.getSource());
        return view;
    }
}
