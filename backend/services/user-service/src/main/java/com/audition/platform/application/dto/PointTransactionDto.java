package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.PointTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 포인트 거래 내역 DTO
 * 작업: POINTS_02_backend_points
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointTransactionDto {
    private Long id;
    private Long userId;
    private PointTransaction.TransactionType transactionType;
    private Long amount;
    private Long balanceBefore;
    private Long balanceAfter;
    private PointTransaction.EventType eventType;
    private Long relatedId;
    private String description;
    private String stripePaymentIntentId;
    private PointTransaction.TransactionStatus status;
    private LocalDateTime createdAt;
}
