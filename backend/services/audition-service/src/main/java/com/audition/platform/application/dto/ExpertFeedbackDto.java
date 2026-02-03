package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.ExpertFeedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 전문가 평가 DTO
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpertFeedbackDto {
    private Long id;
    private Long assetId;
    private Long evaluatorId;
    private String evaluatorName; // 내부 API로 조회
    private ExpertFeedback.EvaluatorType evaluatorType;
    private Integer rating;
    private String comment;
    private String evidenceLink;
    private Boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
