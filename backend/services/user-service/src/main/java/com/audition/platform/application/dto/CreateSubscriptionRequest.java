package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 구독 생성 요청
 * 작업: 2026_08_stripe_payment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSubscriptionRequest {
    @NotBlank(message = "고객 ID는 필수입니다")
    private String customerId;

    @NotBlank(message = "가격 ID는 필수입니다")
    private String priceId;
}
