package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.dto.CreateAuditionRequest;
import com.audition.platform.application.dto.UpdateAuditionRequest;
import com.audition.platform.application.mapper.AuditionMapper;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.AuditionRepository;
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

    @Transactional(readOnly = true)
    public Page<AuditionDto> getAuditions(String category, String status, Pageable pageable) {
        // TODO: 필터링 로직 구현
        List<Audition.AuditionStatus> statuses = Arrays.asList(
                Audition.AuditionStatus.ONGOING,
                Audition.AuditionStatus.UNDER_SCREENING,
                Audition.AuditionStatus.FINISHED
        );
        
        Page<Audition> auditions = auditionRepository.findByStatusIn(statuses, pageable);
        return auditions.map(auditionMapper::toDto);
    }

    @Transactional(readOnly = true)
    public AuditionDto getAuditionById(Long id) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));
        return auditionMapper.toDto(audition);
    }

    public AuditionDto createAudition(Long businessId, CreateAuditionRequest request) {
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
        return auditionMapper.toDto(saved);
    }

    public AuditionDto updateAudition(Long id, UpdateAuditionRequest request) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));

        // 권한 확인: 현재 사용자가 해당 오디션의 소유자인지
        Long businessId = com.audition.platform.infrastructure.security.SecurityUtils.getCurrentUserIdOrThrow();
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
        return auditionMapper.toDto(updated);
    }

    public void deleteAudition(Long id) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));
        
        // 권한 확인: 현재 사용자가 해당 오디션의 소유자인지
        Long businessId = com.audition.platform.infrastructure.security.SecurityUtils.getCurrentUserIdOrThrow();
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 삭제할 수 있습니다");
        }
        
        auditionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<AuditionDto> getAuditionsByBusiness(Long businessId, Pageable pageable) {
        // 기획사는 자신의 모든 오디션을 볼 수 있음 (WRITING 포함)
        Page<Audition> auditions = auditionRepository.findByBusinessId(businessId, pageable);
        return auditions.map(auditionMapper::toDto);
    }

    /**
     * 관리자용: 모든 오디션 조회 (삭제되지 않은 모든 상태 포함)
     */
    @Transactional(readOnly = true)
    public Page<AuditionDto> getAllAuditionsForAdmin(Pageable pageable) {
        com.audition.platform.infrastructure.security.SecurityUtils.requireAdmin();
        Page<Audition> auditions = auditionRepository.findAll(pageable);
        return auditions.map(auditionMapper::toDto);
    }

    /**
     * 관리자용: 오디션 강제 삭제 (소유자 확인 없이)
     */
    public void deleteAuditionAsAdmin(Long id) {
        com.audition.platform.infrastructure.security.SecurityUtils.requireAdmin();
        if (!auditionRepository.existsById(id)) {
            throw new RuntimeException("Audition not found: " + id);
        }
        auditionRepository.deleteById(id);
    }
}
