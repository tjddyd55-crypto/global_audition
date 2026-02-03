package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 오디션별 통계 DTO
 * 작업: 2026_02_architecture_ssot_baseline (Skeleton)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditionStatsDto {
    /**
     * 단계별 지원자 수
     * Key: stage (0=지원, 1=1차합격, 2=2차합격, 3=3차합격)
     * Value: 해당 단계의 지원자 수
     */
    private Map<Integer, Long> applicantsPerStage;
}
