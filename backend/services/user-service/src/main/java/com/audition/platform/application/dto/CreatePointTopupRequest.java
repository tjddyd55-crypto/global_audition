package com.audition.platform.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 충전 요청
 * 작업: POINTS_03_stripe_topup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePointTopupRequest {
    @NotNull(message = "충전할 포인트는 필수입니다")
    @Min(value = 1, message = "충전 포인트는 1 이상이어야 합니다")
    private Long points; // 충전할 포인트 (예: 1000 포인트)
}
