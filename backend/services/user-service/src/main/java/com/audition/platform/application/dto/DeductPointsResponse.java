package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 차감 응답 (내부 API용)
 * 작업: POINTS_04_usage_deduction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductPointsResponse {
    private Long transactionId; // 거래 ID (롤백 시 사용)
    private Long balanceBefore; // 차감 전 잔액
    private Long balanceAfter; // 차감 후 잔액
    private boolean success;
    private String message;
}
