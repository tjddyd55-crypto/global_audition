package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.mapper.AuditionMapper;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.AuditionRepository;
import com.audition.platform.infrastructure.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * 오디션 검색 서비스
 * 작업: 2026_19_search_discovery
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AuditionSearchService {

    private final AuditionRepository auditionRepository;
    private final AuditionMapper auditionMapper;
    private final UserServiceClient userServiceClient;

    /**
     * 오디션 검색
     */
    public Page<AuditionDto> searchAuditions(String keyword, String category, String status, Pageable pageable) {
        Specification<Audition> spec = Specification.where(null);

        // 키워드 검색 (제목, 설명)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String searchKeyword = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("title")), searchKeyword),
                    cb.like(cb.lower(root.get("description")), searchKeyword)
                )
            );
        }

        // 카테고리 필터
        if (category != null && !category.trim().isEmpty()) {
            try {
                Audition.AuditionCategory categoryEnum = Audition.AuditionCategory.valueOf(category.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), categoryEnum));
            } catch (IllegalArgumentException e) {
                log.warn("올바르지 않은 카테고리: {}", category);
            }
        }

        // 상태 필터
        if (status != null && !status.trim().isEmpty()) {
            try {
                Audition.AuditionStatus statusEnum = Audition.AuditionStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException e) {
                log.warn("올바르지 않은 상태: {}", status);
            }
        } else {
            // 기본값: 진행 중인 오디션만
            List<Audition.AuditionStatus> activeStatuses = Arrays.asList(
                    Audition.AuditionStatus.ONGOING,
                    Audition.AuditionStatus.UNDER_SCREENING
            );
            spec = spec.and((root, query, cb) -> root.get("status").in(activeStatuses));
        }

        Page<Audition> auditions = auditionRepository.findAll(spec, pageable);
        
        return auditions.map(audition -> {
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
        });
    }
}
