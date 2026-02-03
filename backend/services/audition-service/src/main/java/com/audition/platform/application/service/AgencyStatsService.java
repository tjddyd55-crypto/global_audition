package com.audition.platform.application.service;

import com.audition.platform.application.dto.AgencyDashboardStatsDto;
import com.audition.platform.application.dto.AuditionStatsDto;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 기획사 통계 서비스
 * 작업: 2026_03_stats_api_implementation
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgencyStatsService {

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;

    /**
     * 기획사 대시보드 통계 조회
     * 
     * @param businessId 기획사 ID
     * @return 대시보드 통계
     */
    public AgencyDashboardStatsDto getDashboardStats(Long businessId) {
        // 기획사별 오디션 수
        long totalAuditions = auditionRepository.countByBusinessId(businessId);
        
        // 해당 기획사의 모든 오디션 ID 조회
        List<Long> auditionIds = auditionRepository.findByBusinessId(businessId, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent()
                .stream()
                .map(Audition::getId)
                .collect(Collectors.toList());
        
        // 해당 오디션들에 지원한 고유 지원자 수 (중복 제거)
        long totalApplicants = auditionIds.isEmpty() 
                ? 0L 
                : applicationRepository.countDistinctUsersByAuditionIds(auditionIds);
        
        return AgencyDashboardStatsDto.builder()
                .totalAuditions(totalAuditions)
                .totalApplicants(totalApplicants)
                .build();
    }

    /**
     * 오디션별 통계 조회
     * 
     * @param auditionId 오디션 ID
     * @return 오디션 통계
     */
    public AuditionStatsDto getAuditionStats(Long auditionId) {
        // currentStage별 지원자 수 집계
        List<Object[]> stageCounts = applicationRepository.countByAuditionIdGroupByCurrentStage(auditionId);
        
        Map<Integer, Long> applicantsPerStage = new HashMap<>();
        
        // 결과를 Map으로 변환
        for (Object[] result : stageCounts) {
            Integer stage = (Integer) result[0];
            Long count = (Long) result[1];
            applicantsPerStage.put(stage, count);
        }
        
        // 단계가 없는 경우 0으로 초기화 (0=지원, 1=1차합격, 2=2차합격, 3=최종합격)
        for (int stage = 0; stage <= 3; stage++) {
            applicantsPerStage.putIfAbsent(stage, 0L);
        }
        
        return AuditionStatsDto.builder()
                .applicantsPerStage(applicantsPerStage)
                .build();
    }
}
