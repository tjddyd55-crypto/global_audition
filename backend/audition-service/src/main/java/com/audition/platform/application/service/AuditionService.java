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

    public AuditionDto createAudition(CreateAuditionRequest request) {
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
                .status(Audition.AuditionStatus.WRITING)
                .businessId(1L) // TODO: 실제 사용자 ID로 변경
                .build();

        Audition saved = auditionRepository.save(audition);
        return auditionMapper.toDto(saved);
    }

    public AuditionDto updateAudition(Long id, UpdateAuditionRequest request) {
        Audition audition = auditionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + id));

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
        if (request.getBannerUrl() != null) audition.setBannerUrl(request.getBannerUrl());

        Audition updated = auditionRepository.save(audition);
        return auditionMapper.toDto(updated);
    }

    public void deleteAudition(Long id) {
        if (!auditionRepository.existsById(id)) {
            throw new RuntimeException("Audition not found: " + id);
        }
        auditionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Page<AuditionDto> getAuditionsByBusiness(Long businessId, Pageable pageable) {
        List<Audition.AuditionStatus> statuses = Arrays.asList(
                Audition.AuditionStatus.ONGOING,
                Audition.AuditionStatus.UNDER_SCREENING,
                Audition.AuditionStatus.FINISHED
        );
        Page<Audition> auditions = auditionRepository.findByBusinessIdAndStatusIn(businessId, statuses, pageable);
        return auditions.map(auditionMapper::toDto);
    }
}
