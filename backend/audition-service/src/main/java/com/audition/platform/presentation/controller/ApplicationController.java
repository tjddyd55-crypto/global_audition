package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.ApplicationDto;
import com.audition.platform.application.dto.CreateApplicationRequest;
import com.audition.platform.application.dto.UpdateScreeningResultRequest;
import com.audition.platform.application.service.ApplicationService;
import com.audition.platform.domain.entity.Application;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "오디션 지원 관리 API")
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    @Operation(summary = "지원서 목록 조회")
    public ResponseEntity<Page<ApplicationDto>> getApplications(
            @RequestParam(required = false) Long auditionId,
            @RequestParam(required = false) Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<ApplicationDto> applications;
        if (auditionId != null) {
            applications = applicationService.getApplications(auditionId, pageable);
        } else if (userId != null) {
            applications = applicationService.getUserApplications(userId, pageable);
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/{id}")
    @Operation(summary = "지원서 상세 조회")
    public ResponseEntity<ApplicationDto> getApplication(@PathVariable Long id) {
        ApplicationDto application = applicationService.getApplication(id);
        return ResponseEntity.ok(application);
    }

    @PostMapping
    @Operation(summary = "오디션 지원", description = "지망생이 오디션에 지원")
    public ResponseEntity<ApplicationDto> createApplication(
            @RequestBody @Valid CreateApplicationRequest request
    ) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경 (인증에서 가져오기)
        ApplicationDto created = applicationService.createApplication(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "지원서 상태 변경")
    public ResponseEntity<ApplicationDto> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam Application.ApplicationStatus status
    ) {
        ApplicationDto updated = applicationService.updateApplicationStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/result1")
    @Operation(summary = "1차 심사 결과 업데이트", description = "기획사만 가능")
    public ResponseEntity<ApplicationDto> updateResult1(
            @PathVariable Long id,
            @RequestBody @Valid UpdateScreeningResultRequest request
    ) {
        ApplicationDto updated = applicationService.updateScreeningResult1(id, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/result2")
    @Operation(summary = "2차 심사 결과 업데이트", description = "기획사만 가능")
    public ResponseEntity<ApplicationDto> updateResult2(
            @PathVariable Long id,
            @RequestBody @Valid UpdateScreeningResultRequest request
    ) {
        ApplicationDto updated = applicationService.updateScreeningResult2(id, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/result3")
    @Operation(summary = "3차 심사 결과 업데이트", description = "기획사만 가능")
    public ResponseEntity<ApplicationDto> updateResult3(
            @PathVariable Long id,
            @RequestBody @Valid UpdateScreeningResultRequest request
    ) {
        ApplicationDto updated = applicationService.updateScreeningResult3(id, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/final-result")
    @Operation(summary = "최종 합격 결과 업데이트", description = "기획사만 가능")
    public ResponseEntity<ApplicationDto> updateFinalResult(
            @PathVariable Long id,
            @RequestBody @Valid UpdateScreeningResultRequest request
    ) {
        ApplicationDto updated = applicationService.updateFinalResult(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "지원서 삭제")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        applicationService.deleteApplication(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/auditions/{auditionId}/results/first-round")
    @Operation(summary = "1차 통과자 목록")
    public ResponseEntity<List<ApplicationDto>> getFirstRoundPassed(@PathVariable Long auditionId) {
        List<ApplicationDto> applications = applicationService.getFirstRoundPassed(auditionId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/auditions/{auditionId}/results/second-round")
    @Operation(summary = "2차 통과자 목록")
    public ResponseEntity<List<ApplicationDto>> getSecondRoundPassed(@PathVariable Long auditionId) {
        List<ApplicationDto> applications = applicationService.getSecondRoundPassed(auditionId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/auditions/{auditionId}/results/third-round")
    @Operation(summary = "3차 통과자 목록")
    public ResponseEntity<List<ApplicationDto>> getThirdRoundPassed(@PathVariable Long auditionId) {
        List<ApplicationDto> applications = applicationService.getThirdRoundPassed(auditionId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/auditions/{auditionId}/results/final")
    @Operation(summary = "최종 합격자 목록")
    public ResponseEntity<List<ApplicationDto>> getFinalPassed(@PathVariable Long auditionId) {
        List<ApplicationDto> applications = applicationService.getFinalPassed(auditionId);
        return ResponseEntity.ok(applications);
    }
}
