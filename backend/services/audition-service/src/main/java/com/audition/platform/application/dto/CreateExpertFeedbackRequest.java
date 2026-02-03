package com.audition.platform.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 전문가 평가 생성 요청
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpertFeedbackRequest {
    @NotNull(message = "자산 ID는 필수입니다")
    private Long assetId;

    @Min(value = 1, message = "평점은 1 이상이어야 합니다")
    @Max(value = 5, message = "평점은 5 이하여야 합니다")
    private Integer rating;

    private String comment;

    private String evidenceLink; // 증거 패키지 보기 링크 (레지스트리/에스크로 서비스에서 생성)

    @Builder.Default
    private Boolean isPublic = true; // 공개 여부 (true: 창작자 프로필 노출, false: 창작자만 확인)
}
