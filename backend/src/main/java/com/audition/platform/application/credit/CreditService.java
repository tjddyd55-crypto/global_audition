package com.audition.platform.application.credit;

import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.domain.credit.CreditTransaction;
import com.audition.platform.domain.credit.CreditTransactionRepository;
import com.audition.platform.domain.credit.UserCredit;
import com.audition.platform.domain.credit.UserCreditRepository;
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

    private final CreditPolicyRepository creditPolicyRepository;
    private final UserCreditRepository userCreditRepository;
    private final CreditTransactionRepository creditTransactionRepository;

    public CreditService(
            CreditPolicyRepository creditPolicyRepository,
            UserCreditRepository userCreditRepository,
            CreditTransactionRepository creditTransactionRepository) {
        this.creditPolicyRepository = creditPolicyRepository;
        this.userCreditRepository = userCreditRepository;
        this.creditTransactionRepository = creditTransactionRepository;
    }

    @Transactional(readOnly = true)
    public long getBalance(UUID userId) {
        return userCreditRepository.findById(userId).map(UserCredit::getBalance).orElse(0L);
    }

    @Transactional(readOnly = true)
    public Page<CreditTransactionDto> listMyTransactions(UUID userId, Pageable pageable) {
        return creditTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable)
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
        if (!policy.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성화된 크레딧 정책입니다.");
        }
        long cost = policy.getCost();
        if (cost < 0) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "잘못된 정책 비용입니다.");
        }
        if (cost == 0) {
            return;
        }

        userCreditRepository.ensureWalletRow(userId);
        UserCredit wallet = userCreditRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "크레딧 지갑을 준비할 수 없습니다."));
        if (wallet.getBalance() < cost) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "크레딧이 부족합니다.");
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
}
