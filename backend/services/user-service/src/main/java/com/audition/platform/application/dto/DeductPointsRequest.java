package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.PointTransaction;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 차감 요청 (내부 API용)
 * 작업: POINTS_04_usage_deduction
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeductPointsRequest {
    @NotNull(message = "차감할 포인트는 필수입니다")
    @Min(value = 1, message = "차감 포인트는 1 이상이어야 합니다")
    private Long amount;

    @NotNull(message = "이벤트 타입은 필수입니다")
    private PointTransaction.EventType eventType;

    private Long relatedId; // 관련 엔티티 ID (오디션 ID, 콘텐츠 ID 등)

    private String description; // 거래 설명
}
