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

        Audition audition = application.getAudition();
        if (audition.getMaxRounds() < 1) {
            throw new RuntimeException("이 오디션은 1차 심사를 진행하지 않습니다");
        }

        application.setResult1(request.getResult());

        // 합격 시 currentStage 업데이트
        if (request.getResult() == Application.ScreeningResult.PASS) {
            application.setCurrentStage(1);
        } else if (request.getResult() == Application.ScreeningResult.FAIL) {
            application.setCurrentStage(0);
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateScreeningResult2(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        Audition audition = application.getAudition();
        if (audition.getMaxRounds() < 2) {
            throw new RuntimeException("이 오디션은 2차 심사를 진행하지 않습니다");
        }

        // 1차 합격 여부 확인
        if (application.getResult1() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("1차 합격자가 아니면 2차 심사를 진행할 수 없습니다");
        }

        application.setResult2(request.getResult());

        // 합격 시 currentStage 업데이트
        if (request.getResult() == Application.ScreeningResult.PASS) {
            application.setCurrentStage(2);
        } else {
            application.setCurrentStage(1);
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateScreeningResult3(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        Audition audition = application.getAudition();
        if (audition.getMaxRounds() < 3) {
            throw new RuntimeException("이 오디션은 3차 심사를 진행하지 않습니다");
        }

        // 2차 합격 여부 확인
        if (application.getResult2() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("2차 합격자가 아니면 3차 심사를 진행할 수 없습니다");
        }

        application.setResult3(request.getResult());

        // 합격 시 currentStage 업데이트
        if (request.getResult() == Application.ScreeningResult.PASS) {
            application.setCurrentStage(3);
        } else {
            application.setCurrentStage(2);
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    public ApplicationDto updateFinalResult(Long id, UpdateScreeningResultRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        Audition audition = application.getAudition();
        
        // 최종 차수 통과 확인
        if (audition.getMaxRounds() >= 3 && application.getResult3() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("3차 합격자가 아니면 최종 합격을 처리할 수 없습니다");
        } else if (audition.getMaxRounds() >= 2 && application.getResult2() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("2차 합격자가 아니면 최종 합격을 처리할 수 없습니다");
        } else if (audition.getMaxRounds() >= 1 && application.getResult1() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("1차 합격자가 아니면 최종 합격을 처리할 수 없습니다");
        }

        application.setFinalResult(request.getResult());

        // 최종 합격 시 currentStage = 3 설정
        if (request.getResult() == Application.ScreeningResult.PASS) {
            application.setCurrentStage(3);
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    /**
     * 지원자 합격 처리 (통합 메서드)
     * @param id 지원서 ID
     * @param businessId 기획사 ID (권한 확인용)
     * @param stage 합격할 차수 (1, 2, 3)
     * @param message 코멘트 (선택)
     * @return 업데이트된 지원서
     */
    public ApplicationDto passApplication(Long id, Long businessId, Integer stage, String message) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // 권한 확인: 현재 사용자가 해당 오디션의 소유자인지
        Audition audition = application.getAudition();
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 지원자를 관리할 수 있습니다");
        }

        // maxRounds 확인
        if (stage > audition.getMaxRounds()) {
            throw new RuntimeException("이 오디션은 " + audition.getMaxRounds() + "차까지 진행됩니다. " + stage + "차는 불가능합니다");
        }

        // 이전 차수 통과 확인
        if (stage >= 2 && application.getResult1() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("1차 합격자가 아니면 2차 이상으로 합격 처리할 수 없습니다");
        }
        if (stage >= 3 && application.getResult2() != Application.ScreeningResult.PASS) {
            throw new RuntimeException("2차 합격자가 아니면 3차로 합격 처리할 수 없습니다");
        }

        // 해당 차수 합격 처리
        switch (stage) {
            case 1:
                application.setResult1(Application.ScreeningResult.PASS);
                application.setCurrentStage(1);
                break;
            case 2:
                application.setResult2(Application.ScreeningResult.PASS);
                application.setCurrentStage(2);
                break;
            case 3:
                application.setResult3(Application.ScreeningResult.PASS);
                application.setCurrentStage(3);
                // 최종 차수이면 finalResult도 설정
                if (audition.getMaxRounds() == stage) {
                    application.setFinalResult(Application.ScreeningResult.PASS);
                }
                break;
            default:
                throw new RuntimeException("stage는 1, 2, 3 중 하나여야 합니다");
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    /**
     * 지원자 불합격 처리
     * @param id 지원서 ID
     * @param businessId 기획사 ID (권한 확인용)
     * @param message 코멘트 (선택)
     * @return 업데이트된 지원서
     */
    public ApplicationDto failApplication(Long id, Long businessId, String message) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // 권한 확인
        Audition audition = application.getAudition();
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 지원자를 관리할 수 있습니다");
        }

        // 현재 단계에 따라 불합격 처리
        Integer currentStage = application.getCurrentStage();
        if (currentStage == null || currentStage == 0) {
            // 지원 단계 - 1차 불합격
            application.setResult1(Application.ScreeningResult.FAIL);
            application.setCurrentStage(0);
        } else if (currentStage == 1) {
            // 1차 통과 - 2차 불합격
            application.setResult2(Application.ScreeningResult.FAIL);
            application.setCurrentStage(1);
        } else if (currentStage == 2) {
            // 2차 통과 - 3차 불합격
            application.setResult3(Application.ScreeningResult.FAIL);
            application.setCurrentStage(2);
        } else {
            // 최종 단계 (currentStage=3) - 최종 불합격 처리
            application.setFinalResult(Application.ScreeningResult.FAIL);
            // 최종 불합격 시에도 현재 단계(3)를 유지하여 이력 추적
            application.setCurrentStage(3);
        }

        Application updated = applicationRepository.save(application);
        return applicationMapper.toDto(updated);
    }

    /**
     * 오디션별 지원자 목록 조회 (필터링 지원)
     * @param auditionId 오디션 ID
     * @param businessId 기획사 ID (권한 확인용)
     * @param stage 필터링할 차수 (null=전체, 0=지원, 1=1차합격, 2=2차합격, 3=최종합격)
     * @param status 필터링할 상태 (null=전체)
     * @param pageable 페이지네이션
     * @return 지원자 목록
     */
    @Transactional(readOnly = true)
    public Page<ApplicationDto> getApplicationsByAudition(
            Long auditionId, 
            Long businessId, 
            Integer stage, 
            Application.ApplicationStatus status,
            Pageable pageable) {
        // 권한 확인
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + auditionId));
        if (!audition.getBusinessId().equals(businessId)) {
            throw new RuntimeException("이 오디션의 소유자만 지원자 목록을 조회할 수 있습니다");
        }

        Page<Application> applications;
        if (stage != null) {
            applications = applicationRepository.findByAuditionIdAndCurrentStage(auditionId, stage, pageable);
        } else if (status != null) {
            applications = applicationRepository.findByAuditionIdAndStatus(auditionId, status, pageable);
        } else {
            applications = applicationRepository.findByAuditionId(auditionId, pageable);
        }

        return applications.map(applicationMapper::toDto);
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
