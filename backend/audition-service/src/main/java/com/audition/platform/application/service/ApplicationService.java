package com.audition.platform.application.service;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.application.dto.CreateApplicationRequest;
import com.audition.platform.application.dto.UpdateScreeningResultRequest;
import com.audition.platform.application.mapper.ApplicationMapper;
import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final ApplicationMapper applicationMapper;

    private static final BigDecimal APPLICATION_FEE = new BigDecimal("5.00"); // 5달러

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getApplications(Long auditionId, Pageable pageable) {
        Page<Application> applications = applicationRepository.findByAuditionId(auditionId, pageable);
        return applications.map(applicationMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getUserApplications(Long userId, Pageable pageable) {
        Page<Application> applications = applicationRepository.findByUserId(userId, pageable);
        return applications.map(applicationMapper::toDto);
    }

    @Transactional(readOnly = true)
    public ApplicationDto getApplication(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));
        return applicationMapper.toDto(application);
    }

    public ApplicationDto createApplication(Long userId, CreateApplicationRequest request) {
        // 오디션 존재 확인
        Audition audition = auditionRepository.findById(request.getAuditionId())
                .orElseThrow(() -> new RuntimeException("Audition not found: " + request.getAuditionId()));

        // 이미 지원했는지 확인
        applicationRepository.findByUserIdAndAuditionId(userId, request.getAuditionId())
                .ifPresent(app -> {
                    throw new RuntimeException("Already applied to this audition");
                });

        // 지원서 생성
        Application application = Application.builder()
                .audition(audition)
                .userId(userId)
                .status(Application.ApplicationStatus.WRITING)
                .videoId1(request.getVideoId1())
                .videoId2(request.getVideoId2())
                .photos(request.getPhotos())
                .paymentAmount(APPLICATION_FEE.doubleValue())
                .build();

        Application saved = applicationRepository.save(application);
        return applicationMapper.toDto(saved);
    }

    public ApplicationDto updateApplicationStatus(Long id, Application.ApplicationStatus status) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        application.setStatus(status);
        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateScreeningResult1(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        application.setResult1(request.getResult());
        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateScreeningResult2(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        application.setResult2(request.getResult());
        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateScreeningResult3(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        application.setResult3(request.getResult());
        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateFinalResult(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        application.setFinalResult(request.getResult());
        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public void deleteApplication(Long id, Long userId) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        if (!application.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this application");
        }

        applicationRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getFirstRoundPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndResult1(
                auditionId, Application.ScreeningResult.PASS);
        return applications.stream().map(applicationMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getSecondRoundPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndResult1AndResult2(
                auditionId,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS
        );
        return applications.stream().map(applicationMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getThirdRoundPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndAllResults(
                auditionId,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS
        );
        return applications.stream().map(applicationMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getFinalPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndFinalResult(
                auditionId, Application.ScreeningResult.PASS);
        return applications.stream().map(applicationMapper::toDto).toList();
    }
}
