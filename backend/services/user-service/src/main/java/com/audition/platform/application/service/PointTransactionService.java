package com.audition.platform.application.service;

import com.audition.platform.application.dto.PointTransactionDto;
import com.audition.platform.domain.entity.PointTransaction;
import com.audition.platform.domain.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 포인트 거래 내역 서비스
 * 작업: POINTS_04_usage_deduction
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class PointTransactionService {

    private final PointTransactionRepository pointTransactionRepository;

    /**
     * 거래 내역 조회
     */
    public Page<PointTransactionDto> getTransactions(Long userId, Pageable pageable) {
        return pointTransactionRepository.findByUserId(userId, pageable)
                .map(this::toDto);
    }

    /**
     * 거래 내역 조회 (타입별)
     */
    public Page<PointTransactionDto> getTransactionsByType(
            Long userId, PointTransaction.TransactionType type, Pageable pageable) {
        return pointTransactionRepository.findByUserIdAndTransactionType(userId, type, pageable)
                .map(this::toDto);
    }

    /**
     * 거래 내역 조회 (이벤트 타입별)
     */
    public Page<PointTransactionDto> getTransactionsByEventType(
            Long userId, PointTransaction.EventType eventType, Pageable pageable) {
        return pointTransactionRepository.findByUserIdAndEventType(userId, eventType, pageable)
                .map(this::toDto);
    }

    private PointTransactionDto toDto(PointTransaction transaction) {
        return PointTransactionDto.builder()
                .id(transaction.getId())
                .userId(transaction.getUserId())
                .transactionType(transaction.getTransactionType())
                .amount(transaction.getAmount())
                .balanceBefore(transaction.getBalanceBefore())
                .balanceAfter(transaction.getBalanceAfter())
                .eventType(transaction.getEventType())
                .relatedId(transaction.getRelatedId())
                .description(transaction.getDescription())
                .stripePaymentIntentId(transaction.getStripePaymentIntentId())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .build();
    }
}
