package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.ContentReportDto;
import com.audition.platform.application.dto.CreateContentReportRequest;
import com.audition.platform.application.service.ContentModerationService;
import com.audition.platform.domain.entity.ContentReport;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 콘텐츠 관리 컨트롤러
 * 작업: OPS_02_content_moderation
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Content Moderation", description = "콘텐츠 신고/관리 API")
public class ContentModerationController {

    private final ContentModerationService contentModerationService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping
    @Operation(summary = "콘텐츠 신고", description = "영상, 댓글, 사용자 신고")
    public ResponseEntity<ContentReportDto> createReport(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateContentReportRequest request
    ) {
        Long reporterId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ContentReportDto report = contentModerationService.createReport(reporterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }

    @GetMapping("/my")
    @Operation(summary = "내 신고 목록 조회")
    public ResponseEntity<Page<ContentReportDto>> getMyReports(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long reporterId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<ContentReportDto> reports = contentModerationService.getMyReports(reporterId, pageable);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/admin")
    @Operation(summary = "신고 목록 조회 (관리자)", description = "관리자만 접근 가능")
    public ResponseEntity<Page<ContentReportDto>> getReports(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) ContentReport.ReportStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        // TODO: 관리자 권한 확인 필요
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<ContentReportDto> reports = contentModerationService.getReports(status, pageable);
        return ResponseEntity.ok(reports);
    }

    @PutMapping("/admin/{id}/review")
    @Operation(summary = "신고 검토 시작 (관리자)")
    public ResponseEntity<ContentReportDto> startReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        // TODO: 관리자 권한 확인 필요
        Long reviewerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ContentReportDto report = contentModerationService.startReview(id, reviewerId);
        return ResponseEntity.ok(report);
    }

    @PutMapping("/admin/{id}/resolve")
    @Operation(summary = "신고 처리 완료 (관리자)")
    public ResponseEntity<ContentReportDto> resolveReport(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody ResolutionRequest request
    ) {
        // TODO: 관리자 권한 확인 필요
        Long reviewerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ContentReportDto report = contentModerationService.resolveReport(id, reviewerId, request.getResolution());
        return ResponseEntity.ok(report);
    }

    @PutMapping("/admin/{id}/reject")
    @Operation(summary = "신고 기각 (관리자)")
    public ResponseEntity<ContentReportDto> rejectReport(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody RejectionRequest request
    ) {
        // TODO: 관리자 권한 확인 필요
        Long reviewerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        ContentReportDto report = contentModerationService.rejectReport(id, reviewerId, request.getReason());
        return ResponseEntity.ok(report);
    }

    @Data
    private static class ResolutionRequest {
        private String resolution;
    }

    @Data
    private static class RejectionRequest {
        private String reason;
    }
}
