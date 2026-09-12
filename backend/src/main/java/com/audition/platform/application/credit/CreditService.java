package com.audition.platform.application.credit;

import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import com.audition.platform.api.dto.CreditPolicyPublicDto;
import com.audition.platform.api.dto.CreditRuntimePublicDto;
import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.domain.credit.CreditTransaction;
import com.audition.platform.domain.credit.CreditTransactionRepository;
import com.audition.platform.domain.credit.UserCredit;
import com.audition.platform.domain.credit.UserCreditRepository;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import com.audition.platform.domain.credit.CreditTransactionSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class CreditService {

    private static final String CHARGE_REASON_MANUAL = "MANUAL";
    public static final String REASON_ADMIN_GRANT = "ADMIN_GRANT";
    public static final String REASON_ADMIN_DEDUCT = "ADMIN_DEDUCT";
    /** 결제 완료 후 패키지 충전 */
    /** 기존 원장 reason. 제품 용어 CREDIT_PURCHASE 와 동일 의미. */
    public static final String REASON_PACKAGE_PURCHASE = "PACKAGE_PURCHASE";
    public static final String REASON_SIGNUP_REWARD = "SIGNUP_REWARD";
    public static final String MODE_FREE = "FREE";
    public static final String MODE_CREDIT = "CREDIT";

    private final CreditPolicyRepository creditPolicyRepository;
    private final UserCreditRepository userCreditRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final CreditPolicyPublicSnapshotCache creditPolicyPublicSnapshotCache;

    public CreditService(
            CreditPolicyRepository creditPolicyRepository,
            UserCreditRepository userCreditRepository,
            CreditTransactionRepository creditTransactionRepository,
            CreditPolicyPublicSnapshotCache creditPolicyPublicSnapshotCache) {
        this.creditPolicyRepository = creditPolicyRepository;
        this.userCreditRepository = userCreditRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.creditPolicyPublicSnapshotCache = creditPolicyPublicSnapshotCache;
    }

    @Transactional(readOnly = true)
    public long getBalance(UUID userId) {
        return userCreditRepository.findById(userId).map(UserCredit::getBalance).orElse(0L);
    }

    /**
     * 공개 정책 스냅샷 (비용·활성 여부). 로그인 불필요 경로에서 사용.
     */
    @Transactional(readOnly = true)
    public CreditPolicyPublicDto getPolicyPublicSnapshot(String policyKey) {
        return creditPolicyPublicSnapshotCache.getOrLoad(policyKey, () -> loadPolicyPublicFromDb(policyKey));
    }

    private CreditPolicyPublicDto loadPolicyPublicFromDb(String policyKey) {
        CreditPolicy policy = creditPolicyRepository.findById(policyKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "크레딧 정책을 찾을 수 없습니다."));
        return new CreditPolicyPublicDto(policyKey, policy.getCost(), policy.isActive());
    }

    @Transactional(readOnly = true)
    public Page<CreditTransactionDto> listMyTransactions(UUID userId, String type, Pageable pageable) {
        if (type == null || type.isBlank()) {
            return creditTransactionRepository
                    .findByUserIdOrderByCreatedAtDesc(userId, pageable)
                    .map(CreditTransactionMapper::toDto);
        }
        return creditTransactionRepository
                .findAll(CreditTransactionSpecifications.forUserWithOptionalType(userId, type), pageable)
                .map(CreditTransactionMapper::toDto);
    }

    private void persistCreditTransaction(
            UUID userId,
            long amount,
            String type,
            String reason,
            String referenceId,
            UUID grantedBy,
            String note,
            long beforeBalance,
            long afterBalance) {
        CreditTransaction tx = new CreditTransaction();
        tx.setUserId(userId);
        tx.setAmount(amount);
        tx.setType(type);
        tx.setReason(reason);
        tx.setReferenceId(referenceId);
        tx.setGrantedBy(grantedBy);
        tx.setNote(note);
        tx.setBeforeBalance(beforeBalance);
        tx.setAfterBalance(afterBalance);
        creditTransactionRepository.save(tx);
    }

    /**
     * 수동 충전(결제 연동 전). 양수만 허용.
     */
    @Transactional
    public long chargeCredits(UUID userId, long amount) {
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "충전 금액은 1 이상이어야 합니다.");
        }
        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        long before = wallet.getBalance();
        long after = before + amount;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        persistCreditTransaction(
                userId,
                amount,
                CreditTransactionType.CHARGE,
                CHARGE_REASON_MANUAL,
                null,
                null,
                "SELF_API_CHARGE",
                before,
                after);
        return after;
    }

    @Transactional
    public void useCredits(UUID userId, String policyKey, String referenceId) {
        CreditPolicy policy = creditPolicyRepository.findById(policyKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "크레딧 정책을 찾을 수 없습니다."));
        if (!policy.isActive() || policy.getCost() <= 0) {
            return;
        }
        long cost = policy.getCost();

        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        if (wallet.getBalance() < cost) {
            throw new InsufficientCreditsException(cost, wallet.getBalance());
        }
        long before = wallet.getBalance();
        long after = before - cost;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        persistCreditTransaction(
                userId,
                -cost,
                CreditTransactionType.USE,
                policyKey,
                referenceId,
                null,
                "policy_use ref=" + referenceId,
                before,
                after);
    }

    /**
     * 슈퍼관리자 수동 조정. 양수: CHARGE+ADMIN_GRANT, 음수: USE+ADMIN_DEDUCT.
     */
    @Transactional
    public long applyAdminBalanceDelta(UUID targetUserId, long delta, UUID grantedBy, String note) {
        if (delta == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조정 금액은 0이 될 수 없습니다.");
        }
        userCreditRepository.ensureWalletRow(targetUserId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        Instant now = Instant.now();
        long before = wallet.getBalance();
        String ref = grantedBy != null ? grantedBy.toString() : null;
        String noteResolved = note != null && !note.isBlank() ? note.trim() : (delta < 0 ? "admin_deduct" : "admin_adjust_positive");

        if (delta > 0) {
            long after = before + delta;
            wallet.setBalance(after);
            wallet.setUpdatedAt(now);
            userCreditRepository.save(wallet);
            persistCreditTransaction(
                    targetUserId,
                    delta,
                    CreditTransactionType.CHARGE,
                    REASON_ADMIN_GRANT,
                    ref,
                    grantedBy,
                    noteResolved,
                    before,
                    after);
            return after;
        }

        long deduct = -delta;
        if (before < deduct) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "차감할 크레딧이 잔액보다 큽니다.");
        }
        long after = before - deduct;
        wallet.setBalance(after);
        wallet.setUpdatedAt(now);
        userCreditRepository.save(wallet);
        persistCreditTransaction(
                targetUserId,
                -deduct,
                CreditTransactionType.USE,
                REASON_ADMIN_DEDUCT,
                ref,
                grantedBy,
                noteResolved,
                before,
                after);
        return after;
    }

    /**
     * {@code payment_orders} 가 PAID 인 뒤 호출. 동일 {@code orderNo} 로 CHARGE 가 있으면 중복 지급하지 않는다.
     */
    @Transactional
    public long applyChargeFromPaymentOrder(PaymentOrder order) {
        if (order.getStatus() != PaymentOrderStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAID 주문만 크레딧 지급이 가능합니다.");
        }
        UUID userId = order.getUserId();
        String ref = order.getOrderNo();
        if (creditTransactionRepository.existsByUserIdAndTypeAndReferenceId(userId, CreditTransactionType.CHARGE, ref)) {
            return getBalance(userId);
        }
        long total = order.getCredits() + order.getBonusCredits();
        if (total <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지급할 크레딧이 없습니다.");
        }
        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        long before = wallet.getBalance();
        long after = before + total;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        String note = "payment_order packageId=" + order.getPackageId() + " provider=" + order.getProvider();
        persistCreditTransaction(
                userId,
                total,
                CreditTransactionType.CHARGE,
                REASON_PACKAGE_PURCHASE,
                ref,
                null,
                note,
                before,
                after);
        return after;
    }

    @Transactional
    public long grantCredits(UUID userId, long amount, String reason, String referenceId, UUID grantedBy, String note) {
        CreditGrantLimits.validateAmount(amount);
        String normalizedReason = CreditGrantReason.normalize(reason);
        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        long before = wallet.getBalance();
        long after = before + amount;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        String noteResolved = note != null && !note.isBlank() ? note.trim() : "grant reason=" + normalizedReason;
        persistCreditTransaction(
                userId,
                amount,
                CreditTransactionType.GRANT,
                normalizedReason,
                referenceId,
                grantedBy,
                noteResolved,
                before,
                after);
        return after;
    }

    public static String applyPaymentMode(CreditPolicy policy) {
        if (policy == null || !policy.isActive() || policy.getCost() <= 0) {
            return MODE_FREE;
        }
        return MODE_CREDIT;
    }

    @Transactional
    public long grantSignupRewardIfEnabled(UUID userId) {
        CreditPolicy policy = creditPolicyRepository.findById(CreditPolicyKey.SIGNUP_CREDIT).orElse(null);
        if (policy == null || !policy.isActive() || policy.getCost() <= 0) {
            return getBalance(userId);
        }
        if (creditTransactionRepository.existsByUserIdAndTypeAndReason(
                userId, CreditTransactionType.GRANT, REASON_SIGNUP_REWARD)) {
            return getBalance(userId);
        }
        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        if (creditTransactionRepository.existsByUserIdAndTypeAndReason(
                userId, CreditTransactionType.GRANT, REASON_SIGNUP_REWARD)) {
            return wallet.getBalance();
        }
        long amount = policy.getCost();
        long before = wallet.getBalance();
        long after = before + amount;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        persistCreditTransaction(
                userId,
                amount,
                CreditTransactionType.GRANT,
                REASON_SIGNUP_REWARD,
                userId.toString(),
                null,
                "signup_reward",
                before,
                after);
        return after;
    }

    public boolean hasSpentCreditsSince(UUID userId, Instant since) {
        return creditTransactionRepository.existsByUserIdAndTypeAndCreatedAtAfter(
                userId, CreditTransactionType.USE, since);
    }

    /**
     * PAID 주문의 충전분을 환불. 이미 REFUND 가 있으면 멱등.
     * 잔액이 지급액보다 작으면 호출하지 말 것(이미 소비된 크레딧).
     */
    @Transactional
    public long refundChargeFromPaymentOrder(PaymentOrder order, String note) {
        UUID userId = order.getUserId();
        String ref = order.getOrderNo();
        if (creditTransactionRepository.existsByUserIdAndTypeAndReferenceId(userId, CreditTransactionType.REFUND, ref)) {
            return getBalance(userId);
        }
        long total = order.getCredits() + order.getBonusCredits();
        if (total <= 0) {
            return getBalance(userId);
        }
        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        if (wallet.getBalance() < total) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용한 크레딧이 있어 환불할 수 없습니다.");
        }
        long before = wallet.getBalance();
        long after = before - total;
        wallet.setBalance(after);
        wallet.setUpdatedAt(Instant.now());
        userCreditRepository.save(wallet);
        persistCreditTransaction(
                userId,
                -total,
                CreditTransactionType.REFUND,
                REASON_PACKAGE_PURCHASE,
                ref,
                null,
                note != null && !note.isBlank() ? note.trim() : "payment_refund",
                before,
                after);
        return after;
    }

    @Transactional(readOnly = true)
    public CreditRuntimePublicDto getRuntimePublic() {
        CreditPolicyPublicDto apply = getPolicyPublicSnapshot(CreditPolicyKey.AUDITION_APPLY);
        CreditPolicy signup = creditPolicyRepository.findById(CreditPolicyKey.SIGNUP_CREDIT).orElse(null);
        boolean signupEnabled = signup != null && signup.isActive() && signup.getCost() > 0;
        long signupAmount = signupEnabled ? signup.getCost() : 0;
        return new CreditRuntimePublicDto(
                apply.getApplicationPaymentMode(),
                apply.getApplicationFeeCredits(),
                signupEnabled,
                signupAmount);
    }
}
