package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.mapper.AuditionMapper;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.AuditionRepository;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.infrastructure.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 추천 서비스
 * 작업: 2026_15_recommendation_ranking
 * 
 * 오디션 추천 기준:
 * - 지원자 수 (높을수록 인기)
 * - 최근 생성일 (최신일수록 우선)
 * - 마감일 임박 (마감일이 가까울수록 우선)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class RecommendationService {

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionMapper auditionMapper;
    private final UserServiceClient userServiceClient;

    /**
     * 추천 오디션 목록 조회
     * 추천 점수 = 지원자 수 * 10 + (마감일 임박 보너스) + (최신 보너스)
     */
    public Page<AuditionDto> getRecommendedAuditions(Pageable pageable) {
        // 지원자 수가 많은 오디션 우선
        // 최근 생성된 오디션 우선
        // 마감일이 임박한 오디션 우선
        
        // 단순 규칙: 지원자 수 기준 정렬
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Audition> auditions = auditionRepository.findByStatusIn(
                List.of(Audition.AuditionStatus.ONGOING, Audition.AuditionStatus.UNDER_SCREENING),
                sortedPageable
        );
        
        // 지원자 수로 재정렬 (실시간 계산)
        List<Audition> sortedAuditions = auditions.getContent().stream()
                .sorted((a1, a2) -> {
                    long count1 = applicationRepository.countByAuditionId(a1.getId());
                    long count2 = applicationRepository.countByAuditionId(a2.getId());
                    return Long.compare(count2, count1); // 지원자 수 내림차순
                })
                .collect(Collectors.toList());
        
        log.debug("추천 오디션 조회: {}개", sortedAuditions.size());
        
        // AuditionDto 변환
        List<AuditionDto> dtos = sortedAuditions.stream()
                .map(audition -> {
                    AuditionDto dto = auditionMapper.toDto(audition);
                    // businessName 채우기
                    if (audition.getBusinessId() != null) {
                        try {
                            com.audition.platform.application.dto.UserSummaryDto userSummary = 
                                    userServiceClient.getUserSummary(audition.getBusinessId());
                            if (userSummary != null) {
                                dto.setBusinessName(userSummary.getBusinessName());
                            }
                        } catch (Exception e) {
                            log.warn("기획사 정보 조회 실패: businessId={}", audition.getBusinessId(), e);
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtos, pageable, auditions.getTotalElements());
    }

    /**
     * 인기 오디션 목록 조회 (지원자 수 기준)
     */
    public List<AuditionDto> getPopularAuditions(int limit) {
        List<Audition> auditions = auditionRepository.findByStatusIn(
                List.of(Audition.AuditionStatus.ONGOING, Audition.AuditionStatus.UNDER_SCREENING),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        
        List<Audition> sortedAuditions = auditions.stream()
                .sorted((a1, a2) -> {
                    long count1 = applicationRepository.countByAuditionId(a1.getId());
                    long count2 = applicationRepository.countByAuditionId(a2.getId());
                    return Long.compare(count2, count1);
                })
                .limit(limit)
                .collect(Collectors.toList());

        return sortedAuditions.stream()
                .map(audition -> {
                    AuditionDto dto = auditionMapper.toDto(audition);
                    if (audition.getBusinessId() != null) {
                        try {
                            com.audition.platform.application.dto.UserSummaryDto userSummary =
                                    userServiceClient.getUserSummary(audition.getBusinessId());
                            if (userSummary != null) {
                                dto.setBusinessName(userSummary.getBusinessName());
                            }
                        } catch (Exception e) {
                            log.warn("기획사 정보 조회 실패: businessId={}", audition.getBusinessId(), e);
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
