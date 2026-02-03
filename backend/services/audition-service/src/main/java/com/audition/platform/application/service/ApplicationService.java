package com.audition.platform.application.service;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.application.dto.CreateApplicationRequest;
import com.audition.platform.application.dto.UpdateScreeningResultRequest;
import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.application.mapper.ApplicationMapper;
import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import com.audition.platform.domain.entity.PointTransaction;
import com.audition.platform.infrastructure.client.PointServiceClient;
import com.audition.platform.infrastructure.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final ApplicationMapper applicationMapper;
    private final AuditionStageService auditionStageService;
    private final UserServiceClient userServiceClient;
    private final ApplicationStatusTransitionService statusTransitionService;
    private final PointServiceClient pointServiceClient; // 작업: POINTS_04_usage_deduction
    private final com.audition.platform.infrastructure.security.CurrentUserContext currentUserContext; // STEP 1: 권한 체크용

    private static final BigDecimal APPLICATION_FEE = new BigDecimal("5.00"); // 5달러
    private static final Long APPLICATION_POINT_COST = 500L; // 오디션 지원 비용: 500 포인트

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getApplications(Long auditionId, Pageable pageable) {
        Page<Application> applications = applicationRepository.findByAuditionId(auditionId, pageable);
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new RuntimeException("Audition not found: " + auditionId));
        return applications.map(app -> enrichApplicationDto(applicationMapper.toDto(app), app, audition));
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getUserApplications(Long userId, Pageable pageable) {
        Page<Application> applications = applicationRepository.findByUserId(userId, pageable);
        return applications.map(app -> {
            ApplicationDto dto = applicationMapper.toDto(app);
            Audition audition = app.getAudition();
            return enrichApplicationDto(dto, app, audition);
        });
    }

    @Transactional(readOnly = true)
    public ApplicationDto getApplication(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));
        ApplicationDto dto = applicationMapper.toDto(application);
        Audition audition = application.getAudition();
        return enrichApplicationDto(dto, application, audition);
    }

    public ApplicationDto createApplication(Long userId, CreateApplicationRequest request) {
        // STEP 1: 권한 체크 - APPLICANT만 오디션 지원 가능
        userServiceClient.requireRole(userId, "APPLICANT");

        // 오디션 존재 확인
        Audition audition = auditionRepository.findById(request.getAuditionId())
                .orElseThrow(() -> new RuntimeException("Audition not found: " + request.getAuditionId()));

        // 오디션 상태 검증 (작업: MVP_01_audition_execution)
        // OPEN 상태(ONGOING)가 아니면 지원 불가
        if (audition.getStatus() != Audition.AuditionStatus.ONGOING) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    String.format("지원 가능한 오디션이 아닙니다. 현재 상태: %s (지원 가능 상태: OPEN)", 
                            audition.getStatus()));
        }

        // 모집 기간 검증 (작업: MVP_01_audition_execution)
        java.time.LocalDate today = java.time.LocalDate.now();
        if (today.isBefore(audition.getStartDate())) {
            throw new RuntimeException(
                    String.format("오디션 모집 시작일이 아닙니다. 모집 시작일: %s", audition.getStartDate()));
        }
        if (today.isAfter(audition.getEndDate())) {
            throw new RuntimeException(
                    String.format("오디션 모집이 마감되었습니다. 모집 마감일: %s", audition.getEndDate()));
        }

        // 이미 지원했는지 확인
        applicationRepository.findByUserIdAndAuditionId(userId, request.getAuditionId())
                .ifPresent(app -> {
                    throw new RuntimeException("이미 이 오디션에 지원하셨습니다");
                });

        // 포인트 차감 (작업: POINTS_04_usage_deduction)
        // 트랜잭션으로 보호: 실패 시 자동 롤백
        com.audition.platform.application.dto.DeductPointsResponse deductResponse = 
                pointServiceClient.deductPoints(
                        userId,
                        APPLICATION_POINT_COST,
                        PointTransaction.EventType.AUDITION_APPLICATION,
                        request.getAuditionId(),
                        "오디션 지원: " + audition.getTitle()
                );

        if (deductResponse == null || !deductResponse.isSuccess()) {
            String errorMessage = deductResponse != null ? deductResponse.getMessage() : "포인트 차감 실패";
            log.error("오디션 지원 포인트 차감 실패: userId={}, auditionId={}, error={}", 
                    userId, request.getAuditionId(), errorMessage);
            throw new RuntimeException("포인트가 부족하거나 차감에 실패했습니다: " + errorMessage);
        }

        log.info("오디션 지원 포인트 차감 완료: userId={}, auditionId={}, transactionId={}, points={}", 
                userId, request.getAuditionId(), deductResponse.getTransactionId(), APPLICATION_POINT_COST);

        // 지원서 생성 (작업: MVP_01_audition_execution)
        // 포인트 차감 성공 시 APPLICATION_COMPLETED 상태로 생성
        Application application = Application.builder()
                .audition(audition)
                .userId(userId)
                .status(Application.ApplicationStatus.APPLICATION_COMPLETED) // 포인트 차감 성공 시 즉시 완료
                .currentStage(0) // 지원 완료 상태
                .videoId1(request.getVideoId1())
                .videoId2(request.getVideoId2())
                .photos(request.getPhotos())
                .paymentAmount(APPLICATION_FEE.doubleValue())
                .build();

        Application saved = applicationRepository.save(application);
        
        // Creative Vault asset_id 첨부 (작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION)
        if (request.getAssetIds() != null && !request.getAssetIds().isEmpty()) {
            for (Long assetId : request.getAssetIds()) {
                com.audition.platform.domain.entity.ApplicationAttachment attachment = 
                    com.audition.platform.domain.entity.ApplicationAttachment.builder()
                        .id(new com.audition.platform.domain.entity.ApplicationAttachment.ApplicationAttachmentId(
                            saved.getId(), assetId))
                        .application(saved)
                        .assetId(assetId)
                        .build();
                saved.getAttachments().add(attachment);
            }
            saved = applicationRepository.save(saved);
        }
        
        ApplicationDto dto = applicationMapper.toDto(saved);
        return enrichApplicationDto(dto, saved, audition);
    }

    /**
     * 지원서 상태 업데이트
     * 작업: MVP_01_audition_execution - 상태 전이 검증 강화
     */
    public ApplicationDto updateApplicationStatus(Long id, Application.ApplicationStatus status) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // 상태 전이 검증 (작업: MVP_01_audition_execution)
        Application.ApplicationStatus currentStatus = application.getStatus();
        
        // 허용된 상태 전이만 허용
        if (currentStatus == Application.ApplicationStatus.APPLICATION_COMPLETED 
                && status == Application.ApplicationStatus.CANCEL) {
            // 지원 완료 → 취소는 허용
        } else if (currentStatus == Application.ApplicationStatus.WRITING 
                && status == Application.ApplicationStatus.APPLICATION_COMPLETED) {
            // 작성 중 → 지원 완료는 허용
        } else if (currentStatus == Application.ApplicationStatus.INCOMPLETE_PAYMENT 
                && status == Application.ApplicationStatus.APPLICATION_COMPLETED) {
            // 결제 미완료 → 지원 완료는 허용 (재시도)
        } else if (currentStatus == status) {
            // 동일 상태는 허용 (idempotency)
        } else {
            throw new IllegalStateException(
                    String.format("허용되지 않은 상태 전이입니다. 현재: %s → 요청: %s", currentStatus, status));
        }

        application.setStatus(status);
        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        Audition audition = updated.getAudition();
        return enrichApplicationDto(dto, updated, audition);
    }

    /**
     * 1차 심사 결과 업데이트
     * 작업: MVP_01_audition_execution - 예외 처리 및 검증 강화
     * STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
     */
    public ApplicationDto updateScreeningResult1(Long id, UpdateScreeningResultRequest request) {
        // STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireAnyRole(evaluatorId, "AGENCY", "TRAINER");

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // MVP_01: 오디션이 확정된 경우 심사 결과 수정 불가
        Audition audition = application.getAudition();
        if (audition.getStatus() == Audition.AuditionStatus.FINISHED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "확정된 오디션의 심사 결과는 수정할 수 없습니다");
        }

        // 지원서 상태 검증 (작업: MVP_01_audition_execution)
        if (application.getStatus() != Application.ApplicationStatus.APPLICATION_COMPLETED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    String.format("심사 결과를 업데이트할 수 있는 상태가 아닙니다. 현재 상태: %s", 
                            application.getStatus()));
        }

        if (!isStageEnabled(audition, 1)) {
            throw new RuntimeException("이 오디션은 1차 심사를 진행하지 않습니다");
        }

        statusTransitionService.updateStage1Result(application, request.getResult());

        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        return enrichApplicationDto(dto, updated, audition);
    }

    /**
     * 2차 심사 결과 업데이트
     * 작업: MVP_01_audition_execution - 예외 처리 및 검증 강화
     * STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
     */
    public ApplicationDto updateScreeningResult2(Long id, UpdateScreeningResultRequest request) {
        // STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireAnyRole(evaluatorId, "AGENCY", "TRAINER");

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // MVP_01: 오디션이 확정된 경우 심사 결과 수정 불가
        Audition audition = application.getAudition();
        if (audition.getStatus() == Audition.AuditionStatus.FINISHED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "확정된 오디션의 심사 결과는 수정할 수 없습니다");
        }

        // 지원서 상태 검증 (작업: MVP_01_audition_execution)
        if (application.getStatus() != Application.ApplicationStatus.APPLICATION_COMPLETED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    String.format("심사 결과를 업데이트할 수 있는 상태가 아닙니다. 현재 상태: %s", 
                            application.getStatus()));
        }

        if (!isStageEnabled(audition, 2)) {
            throw new RuntimeException("이 오디션은 2차 심사를 진행하지 않습니다");
        }

        statusTransitionService.updateStage2Result(application, request.getResult());

        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        return enrichApplicationDto(dto, updated, audition);
    }

    /**
     * 3차 심사 결과 업데이트
     * 작업: MVP_01_audition_execution - 예외 처리 및 검증 강화
     * STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
     */
    public ApplicationDto updateScreeningResult3(Long id, UpdateScreeningResultRequest request) {
        // STEP 1: 권한 체크 - AGENCY 또는 TRAINER만 심사 가능
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireAnyRole(evaluatorId, "AGENCY", "TRAINER");

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // MVP_01: 오디션이 확정된 경우 심사 결과 수정 불가
        Audition audition = application.getAudition();
        if (audition.getStatus() == Audition.AuditionStatus.FINISHED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT, "확정된 오디션의 심사 결과는 수정할 수 없습니다");
        }

        // 지원서 상태 검증 (작업: MVP_01_audition_execution)
        if (application.getStatus() != Application.ApplicationStatus.APPLICATION_COMPLETED) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    String.format("심사 결과를 업데이트할 수 있는 상태가 아닙니다. 현재 상태: %s", 
                            application.getStatus()));
        }

        if (!isStageEnabled(audition, 3)) {
            throw new RuntimeException("이 오디션은 3차 심사를 진행하지 않습니다");
        }

        statusTransitionService.updateStage3Result(application, request.getResult());

        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        return enrichApplicationDto(dto, updated, audition);
    }

    /**
     * 최종 결과 업데이트
     * 작업: MVP_01_audition_execution - 예외 처리 및 검증 강화
     * STEP 1: 권한 체크 - AGENCY만 결과 확정 가능
     */
    public ApplicationDto updateFinalResult(Long id, UpdateScreeningResultRequest request) {
        // STEP 1: 권한 체크 - AGENCY만 결과 확정 가능
        Long evaluatorId = currentUserContext.getCurrentUserIdOrThrow();
        userServiceClient.requireRole(evaluatorId, "AGENCY");

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found: " + id));

        // 지원서 상태 검증 (작업: MVP_01_audition_execution)
        if (application.getStatus() != Application.ApplicationStatus.APPLICATION_COMPLETED) {
            throw new IllegalStateException(
                    String.format("최종 결과를 업데이트할 수 있는 상태가 아닙니다. 현재 상태: %s", 
                            application.getStatus()));
        }

        Audition audition = application.getAudition();
        statusTransitionService.updateFinalResult(application, audition, request.getResult());

        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        return enrichApplicationDto(dto, updated, audition);
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
        int maxRounds = getStageCount(audition);
        if (stage > maxRounds) {
            throw new RuntimeException("이 오디션은 " + maxRounds + "차까지 진행됩니다. " + stage + "차는 불가능합니다");
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
                if (maxRounds == stage) {
                    application.setFinalResult(Application.ScreeningResult.PASS);
                }
                break;
            default:
                throw new RuntimeException("stage는 1, 2, 3 중 하나여야 합니다");
        }

        Application updated = applicationRepository.save(application);
        ApplicationDto dto = applicationMapper.toDto(updated);
        Audition audition = updated.getAudition();
        return enrichApplicationDto(dto, updated, audition);
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
        ApplicationDto dto = applicationMapper.toDto(updated);
        Audition audition = updated.getAudition();
        return enrichApplicationDto(dto, updated, audition);
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

        return applications.map(app -> {
            ApplicationDto dto = applicationMapper.toDto(app);
            Audition audition = app.getAudition();
            return enrichApplicationDto(dto, app, audition);
        });
    }

    /**
     * ApplicationDto에 내부 API로 조회한 정보 채우기
     * 작업: 2026_03_service_integration, GA_20260202_CREATIVE_REGISTRY_EXTENSION
     */
    private ApplicationDto enrichApplicationDto(ApplicationDto dto, Application application, Audition audition) {
        // auditionTitle: 같은 서비스 내 엔티티에서 직접 조회
        if (audition != null) {
            dto.setAuditionTitle(audition.getTitle());
        }
        
        // userName: User Service 내부 API 호출
        if (application.getUserId() != null) {
            UserSummaryDto userSummary = userServiceClient.getUserSummary(application.getUserId());
            if (userSummary != null) {
                dto.setUserName(userSummary.getUserName());
            }
        }
        
        // assetIds: Creative Vault asset_id 목록
        if (application.getAttachments() != null) {
            List<Long> assetIds = application.getAttachments().stream()
                    .map(com.audition.platform.domain.entity.ApplicationAttachment::getAssetId)
                    .collect(java.util.stream.Collectors.toList());
            dto.setAssetIds(assetIds);
        }
        
        return dto;
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
        return applications.stream()
                .map(app -> {
                    ApplicationDto dto = applicationMapper.toDto(app);
                    Audition audition = app.getAudition();
                    return enrichApplicationDto(dto, app, audition);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getSecondRoundPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndResult1AndResult2(
                auditionId,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS
        );
        return applications.stream()
                .map(app -> {
                    ApplicationDto dto = applicationMapper.toDto(app);
                    Audition audition = app.getAudition();
                    return enrichApplicationDto(dto, app, audition);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getThirdRoundPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndAllResults(
                auditionId,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS,
                Application.ScreeningResult.PASS
        );
        return applications.stream()
                .map(app -> {
                    ApplicationDto dto = applicationMapper.toDto(app);
                    Audition audition = app.getAudition();
                    return enrichApplicationDto(dto, app, audition);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getFinalPassed(Long auditionId) {
        List<Application> applications = applicationRepository.findByAuditionIdAndFinalResult(
                auditionId, Application.ScreeningResult.PASS);
        return applications.stream()
                .map(app -> {
                    ApplicationDto dto = applicationMapper.toDto(app);
                    Audition audition = app.getAudition();
                    return enrichApplicationDto(dto, app, audition);
                })
                .collect(Collectors.toList());
    }

    private boolean isStageEnabled(Audition audition, int stageNumber) {
        if (audition == null || audition.getId() == null) {
            return false;
        }
        return auditionStageService.isStageEnabled(audition.getId(), stageNumber)
                || stageNumber <= audition.getMaxRounds();
    }

    private int getStageCount(Audition audition) {
        if (audition == null || audition.getId() == null) {
            return 0;
        }
        return auditionStageService.getStageCountOrDefault(audition.getId(), audition.getMaxRounds());
    }
}
