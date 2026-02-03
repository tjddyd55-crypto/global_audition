package com.audition.platform.application.service;

import com.audition.platform.domain.entity.PointTransaction;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.entity.UserPoints;
import com.audition.platform.domain.repository.PointTransactionRepository;
import com.audition.platform.domain.repository.UserPointsRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 포인트 서비스
 * 작업: POINTS_01_system_design, POINTS_02_backend_points
 * 
 * 포인트 차감은 반드시 트랜잭션으로 보호하고, 실패 시 롤백 가능하게 구현
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PointService {

    private final UserPointsRepository userPointsRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final UserRepository userRepository;

    /**
     * 사용자 포인트 초기화 (최초 생성)
     */
    public UserPoints initializePoints(Long userId) {
        if (userPointsRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("이미 포인트가 초기화된 사용자입니다: " + userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        UserPoints userPoints = UserPoints.builder()
                .userId(userId)
                .user(user)
                .balance(0L)
                .build();

        return userPointsRepository.save(userPoints);
    }

    /**
     * 포인트 충전
     * 작업: POINTS_03_stripe_topup
     */
    public PointTransaction chargePoints(
            Long userId,
            Long amount,
            PointTransaction.EventType eventType,
            String stripePaymentIntentId,
            String description
    ) {
        if (amount <= 0) {
            throw new IllegalArgumentException("충전 포인트는 0보다 커야 합니다");
        }

        UserPoints userPoints = getUserPointsWithLock(userId);
        Long balanceBefore = userPoints.getBalance();
        Long balanceAfter = balanceBefore + amount;

        userPoints.setBalance(balanceAfter);
        userPointsRepository.save(userPoints);

        PointTransaction transaction = PointTransaction.builder()
                .userId(userId)
                .transactionType(PointTransaction.TransactionType.CHARGE)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .eventType(eventType)
                .stripePaymentIntentId(stripePaymentIntentId)
                .description(description)
                .status(PointTransaction.TransactionStatus.COMPLETED)
                .build();

        PointTransaction saved = pointTransactionRepository.save(transaction);
        log.info("포인트 충전 완료: userId={}, amount={}, balanceBefore={}, balanceAfter={}", 
                userId, amount, balanceBefore, balanceAfter);

        return saved;
    }

    /**
     * 포인트 차감 (트랜잭션 보호)
     * 작업: POINTS_04_usage_deduction
     * 
     * 실패 시 자동 롤백됨 (@Transactional)
     */
    public PointTransaction deductPoints(
            Long userId,
            Long amount,
            PointTransaction.EventType eventType,
            Long relatedId,
            String description
    ) {
        if (amount <= 0) {
            throw new IllegalArgumentException("차감 포인트는 0보다 커야 합니다");
        }

        UserPoints userPoints = getUserPointsWithLock(userId);
        Long balanceBefore = userPoints.getBalance();

        // 잔액 검증
        if (balanceBefore < amount) {
            throw new RuntimeException(
                    String.format("포인트 잔액이 부족합니다. 현재: %d, 필요: %d", balanceBefore, amount));
        }

        Long balanceAfter = balanceBefore - amount;

        userPoints.setBalance(balanceAfter);
        userPointsRepository.save(userPoints);

        PointTransaction transaction = PointTransaction.builder()
                .userId(userId)
                .transactionType(PointTransaction.TransactionType.DEDUCTION)
                .amount(-amount) // 차감은 음수로 저장
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .eventType(eventType)
                .relatedId(relatedId)
                .description(description)
                .status(PointTransaction.TransactionStatus.COMPLETED)
                .build();

        PointTransaction saved = pointTransactionRepository.save(transaction);
        log.info("포인트 차감 완료: userId={}, amount={}, balanceBefore={}, balanceAfter={}", 
                userId, amount, balanceBefore, balanceAfter);

        return saved;
    }

    /**
     * 포인트 차감 롤백
     * 작업: POINTS_04_usage_deduction
     */
    public void rollbackDeduction(Long transactionId) {
        PointTransaction transaction = pointTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        if (transaction.getTransactionType() != PointTransaction.TransactionType.DEDUCTION) {
            throw new RuntimeException("차감 거래만 롤백할 수 있습니다");
        }

        if (transaction.getStatus() == PointTransaction.TransactionStatus.ROLLED_BACK) {
            throw new RuntimeException("이미 롤백된 거래입니다");
        }

        UserPoints userPoints = getUserPointsWithLock(transaction.getUserId());
        Long currentBalance = userPoints.getBalance();
        Long refundAmount = Math.abs(transaction.getAmount()); // 차감된 양만큼 환불

        userPoints.setBalance(currentBalance + refundAmount);
        userPointsRepository.save(userPoints);

        transaction.setStatus(PointTransaction.TransactionStatus.ROLLED_BACK);
        pointTransactionRepository.save(transaction);

        // 롤백 거래 기록
        PointTransaction refundTransaction = PointTransaction.builder()
                .userId(transaction.getUserId())
                .transactionType(PointTransaction.TransactionType.REFUND)
                .amount(refundAmount)
                .balanceBefore(currentBalance)
                .balanceAfter(currentBalance + refundAmount)
                .eventType(PointTransaction.EventType.REFUND)
                .relatedId(transactionId) // 원래 거래 ID 참조
                .description("차감 거래 롤백: " + transaction.getDescription())
                .status(PointTransaction.TransactionStatus.COMPLETED)
                .build();
        pointTransactionRepository.save(refundTransaction);

        log.info("포인트 차감 롤백 완료: transactionId={}, userId={}, refundAmount={}", 
                transactionId, transaction.getUserId(), refundAmount);
    }

    /**
     * 포인트 잔액 조회
     */
    @Transactional(readOnly = true)
    public Long getBalance(Long userId) {
        UserPoints userPoints = userPointsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // 최초 조회 시 자동 초기화
                    return initializePoints(userId);
                });
        return userPoints.getBalance();
    }

    /**
     * 비관적 락으로 포인트 조회 (트랜잭션 보호)
     */
    private UserPoints getUserPointsWithLock(Long userId) {
        UserPoints userPoints = userPointsRepository.findByUserIdWithLock(userId)
                .orElseGet(() -> {
                    // 최초 조회 시 자동 초기화
                    return initializePoints(userId);
                });
        return userPoints;
    }

    /**
     * Payment Intent ID로 거래 존재 여부 확인 (중복 처리 방지)
     * 작업: POINTS_03_stripe_topup
     */
    @Transactional(readOnly = true)
    public boolean isTransactionExists(String stripePaymentIntentId) {
        return pointTransactionRepository.findByStripePaymentIntentId(stripePaymentIntentId).isPresent();
    }
}
