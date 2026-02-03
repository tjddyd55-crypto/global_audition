package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.dto.CreateAuditionRequest;
import com.audition.platform.application.dto.UpdateAuditionRequest;
import com.audition.platform.application.dto.UpdateAuditionStatusRequest;
import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.application.mapper.AuditionMapper;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.AuditionRepository;
import com.audition.platform.infrastructure.client.UserServiceClient;
import com.audition.platform.infrastructure.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditionService {

    private final AuditionRepository auditionRepository;
    private final AuditionMapper auditionMapper;
    private final CurrentUserContext currentUserContext;
    private final AuditionStageService auditionStageService;
    private final UserServiceClient userServiceClient;
    private final AuditionStatusTransitionService auditionStatusTransitionService; // MVP_01: 상태 전이 관리

    @Transactional(readOnly = true)
    public Page<AuditionDto> getAuditions(String category, String status, Pageable pageable) {
        // TODO: 필터링 로직 구현
        List<Audition.AuditionStatus> statuses = Arrays.asList(
                Audition.AuditionStatus.ONGOING,
                Audition.AuditionStatus.UNDER_SCREENING,
                Audition.AuditionStatus.FINISHED
        );
        
        Page<Audition> auditions = auditionRepository.findByStatusIn(statuses, pageable);
        return auditions.map(audition -> enrichAuditionDto(auditionMapper.toDto(audition), audition));
    }

    @Transactional(readOnly = true)
    public AuditionDto getAuditionById(Long id) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));
        return enrichAuditionDto(auditionMapper.toDto(audition), audition);
    }

    public AuditionDto createAudition(Long businessId, CreateAuditionRequest request) {
        // STEP 1: 권한 체크 - AGENCY만 오디션 생성 가능
        userServiceClient.requireRole(businessId, "AGENCY");

        // maxRounds 검증
        Integer maxRounds = request.getMaxRounds() != null ? request.getMaxRounds() : 1;
        if (maxRounds < 1 || maxRounds > 3) {
            throw new RuntimeException("maxRounds는 1~3 사이의 값이어야 합니다");
        }

        // posterUrl이 없으면 bannerUrl 사용 (하위 호환성)
        String posterUrl = request.getPosterUrl() != null ? request.getPosterUrl() : request.getBannerUrl();

        Audition audition = Audition.builder()
                .title(request.getTitle())
                .titleEn(request.getTitleEn())
                .category(request.getCategory())
                .description(request.getDescription())
                .requirements(request.getRequirements())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .screeningDate1(request.getScreeningDate1())
                .screeningDate2(request.getScreeningDate2())
                .screeningDate3(request.getScreeningDate3())
                .bannerUrl(request.getBannerUrl())
                .posterUrl(posterUrl)
                .posterKey(request.getPosterKey())
                .videoType(request.getVideoType() != null ? request.getVideoType() : Audition.VideoType.YOUTUBE)
                .videoUrl(request.getVideoUrl())
                .videoKey(request.getVideoKey())
                .maxRounds(maxRounds)
                .deadlineAt(request.getDeadlineAt())
                .status(request.getStatus() != null ? request.getStatus() : Audition.AuditionStatus.WRITING)
                .businessId(businessId)
                .build();

        Audition saved = auditionRepository.save(audition);
        auditionStageService.createDefaultStages(saved.getId(), maxRounds);
        return enrichAuditionDto(auditionMapper.toDto(saved), saved);
    }

    public AuditionDto updateAudition(Long id, UpdateAuditionRequest request) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));

        // STEP 1: 권한 체크 - AGENCY만 오디션 수정 가능
        Long businessId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireRole(businessId, "AGENCY");
        
        // MVP_01: FINALIZED 이후 수정 불가
        if (audition.getStatus() == Audition.AuditionStatus.FINISHED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "확정된 오디션은 수정할 수 없습니다");
        }
        
        // 소유자 확인
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 수정할 수 있습니다");
        }

        if (request.getTitle() != null) audition.setTitle(request.getTitle());
        if (request.getTitleEn() != null) audition.setTitleEn(request.getTitleEn());
        if (request.getCategory() != null) audition.setCategory(request.getCategory());
        if (request.getDescription() != null) audition.setDescription(request.getDescription());
        if (request.getRequirements() != null) audition.setRequirements(request.getRequirements());
        if (request.getStartDate() != null) audition.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) audition.setEndDate(request.getEndDate());
        if (request.getScreeningDate1() != null) audition.setScreeningDate1(request.getScreeningDate1());
        if (request.getAnnouncementDate1() != null) audition.setAnnouncementDate1(request.getAnnouncementDate1());
        if (request.getScreeningDate2() != null) audition.setScreeningDate2(request.getScreeningDate2());
        if (request.getAnnouncementDate2() != null) audition.setAnnouncementDate2(request.getAnnouncementDate2());
        if (request.getScreeningDate3() != null) audition.setScreeningDate3(request.getScreeningDate3());
        if (request.getAnnouncementDate3() != null) audition.setAnnouncementDate3(request.getAnnouncementDate3());
        if (request.getBannerUrl() != null) {
            audition.setBannerUrl(request.getBannerUrl());
            // posterUrl이 없으면 bannerUrl 사용
            if (request.getPosterUrl() == null) {
                audition.setPosterUrl(request.getBannerUrl());
            }
        }
        if (request.getPosterUrl() != null) audition.setPosterUrl(request.getPosterUrl());
        if (request.getPosterKey() != null) audition.setPosterKey(request.getPosterKey());
        if (request.getVideoType() != null) audition.setVideoType(request.getVideoType());
        if (request.getVideoUrl() != null) audition.setVideoUrl(request.getVideoUrl());
        if (request.getVideoKey() != null) audition.setVideoKey(request.getVideoKey());
        if (request.getMaxRounds() != null) {
            // maxRounds 검증
            if (request.getMaxRounds() < 1 || request.getMaxRounds() > 3) {
                throw new RuntimeException("maxRounds는 1~3 사이의 값이어야 합니다");
            }
            audition.setMaxRounds(request.getMaxRounds());
        }
        if (request.getDeadlineAt() != null) audition.setDeadlineAt(request.getDeadlineAt());
        if (request.getStatus() != null) audition.setStatus(request.getStatus());

        Audition updated = auditionRepository.save(audition);
        return enrichAuditionDto(auditionMapper.toDto(updated), updated);
    }

    /**
     * 오디션 상태 전이 (MVP_01: DRAFT → OPEN → CLOSED → FINALIZED)
     */
    public AuditionDto updateAuditionStatus(Long id, UpdateAuditionStatusRequest request) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));

        // STEP 1: 권한 체크 - AGENCY만 상태 변경 가능
        Long businessId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireRole(businessId, "AGENCY");
        
        // 소유자 확인
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 상태를 변경할 수 있습니다");
        }

        // 상태 전이 수행
        if (request.getStatus() == Audition.AuditionStatus.ONGOING) {
            auditionStatusTransitionService.transitionToOpen(audition);
        } else if (request.getStatus() == Audition.AuditionStatus.UNDER_SCREENING) {
            auditionStatusTransitionService.transitionToClosed(audition);
        } else if (request.getStatus() == Audition.AuditionStatus.FINISHED) {
            auditionStatusTransitionService.transitionToFinalized(audition);
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, 
                    "허용되지 않은 상태 전이입니다: " + request.getStatus());
        }

        Audition updated = auditionRepository.save(audition);
        return enrichAuditionDto(auditionMapper.toDto(updated), updated);
    }

    public void deleteAudition(Long id) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));
        
        // STEP 1: 권한 체크 - AGENCY만 오디션 삭제 가능
        Long businessId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireRole(businessId, "AGENCY");
        
        // 소유자 확인
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 삭제할 수 있습니다");
        }
        
        auditionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<AuditionDto> getAuditionsByBusiness(Long businessId, Pageable pageable) {
        // 기획사는 자신의 모든 오디션을 볼 수 있음 (WRITING 포함)
        Page<Audition> auditions = auditionRepository.findByBusinessId(businessId, pageable);
        return auditions.map(audition -> enrichAuditionDto(auditionMapper.toDto(audition), audition));
    }

    /**
     * 관리자용: 모든 오디션 조회 (삭제되지 않은 모든 상태 포함)
     */
    @Transactional(readOnly = true)
    public Page<AuditionDto> getAllAuditionsForAdmin(Pageable pageable) {
        currentUserContext.requireAdmin();
        Page<Audition> auditions = auditionRepository.findAll(pageable);
        return auditions.map(audition -> enrichAuditionDto(auditionMapper.toDto(audition), audition));
    }

    /**
     * AuditionDto에 내부 API로 조회한 정보 채우기
     * 작업: 2026_03_service_integration
     */
    private AuditionDto enrichAuditionDto(AuditionDto dto, Audition audition) {
        // businessName: User Service 내부 API 호출
        if (audition.getBusinessId() != null) {
            UserSummaryDto userSummary = userServiceClient.getUserSummary(audition.getBusinessId());
            if (userSummary != null) {
                dto.setBusinessName(userSummary.getBusinessName());
            }
        }
        return dto;
    }

    /**
     * 관리자용: 오디션 강제 삭제 (소유자 확인 없이)
     */
    public void deleteAuditionAsAdmin(Long id) {
        currentUserContext.requireAdmin();
        if (!auditionRepository.existsById(id)) {
            throw new RuntimeException("Audition not found: " + id);
        }
        auditionRepository.deleteById(id);
    }
}
