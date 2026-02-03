package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 충전 응답
 * 작업: POINTS_03_stripe_topup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointTopupResponse {
    private String paymentIntentId; // Stripe Payment Intent ID
    private String clientSecret; // 프론트엔드에서 사용할 클라이언트 시크릿
    private Long points; // 충전할 포인트
    private Long amount; // 결제 금액 (원)
}
