package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 기획사 대시보드 통계 DTO
 * 작업: 2026_02_architecture_ssot_baseline (Skeleton)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgencyDashboardStatsDto {
    /**
     * 총 오디션 수
     */
    private Long totalAuditions;

    /**
     * 총 지원자 수
     */
    private Long totalApplicants;
}
