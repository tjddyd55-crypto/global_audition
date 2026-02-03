package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 잔액 DTO
 * 작업: POINTS_02_backend_points
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointBalanceDto {
    private Long userId;
    private Long balance;
}
