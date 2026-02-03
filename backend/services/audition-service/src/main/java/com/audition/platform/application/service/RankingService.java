package com.audition.platform.application.service;

import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 랭킹 서비스
 * 작업: 2026_15_recommendation_ranking
 * 
 * 지원자 랭킹 기준:
 * - 지원한 오디션 수
 * - 합격한 오디션 수
 * - 최종 합격한 오디션 수
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class RankingService {

    private final ApplicationRepository applicationRepository;

    /**
     * 지원자 랭킹 조회 (합격 수 기준)
     */
    public List<Long> getTopApplicantsByPassCount(int limit) {
        // 최종 합격 수가 많은 지원자 순
        List<Object[]> results = applicationRepository.findTopApplicantsByFinalPass(limit);
        
        return results.stream()
                .map(result -> {
                    if (result[0] instanceof Number) {
                        return ((Number) result[0]).longValue();
                    }
                    return (Long) result[0];
                })
                .collect(Collectors.toList());
    }

    /**
     * 지원자 랭킹 조회 (지원 수 기준)
     */
    public List<Long> getTopApplicantsByApplicationCount(int limit) {
        // 지원 수가 많은 지원자 순
        List<Object[]> results = applicationRepository.findTopApplicantsByApplicationCount(limit);
        
        return results.stream()
                .map(result -> {
                    if (result[0] instanceof Number) {
                        return ((Number) result[0]).longValue();
                    }
                    return (Long) result[0];
                })
                .collect(Collectors.toList());
    }
}
