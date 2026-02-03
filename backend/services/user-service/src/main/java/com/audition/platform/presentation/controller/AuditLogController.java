package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditLogDto;
import com.audition.platform.application.dto.CreateAuditLogRequest;
import com.audition.platform.application.service.AuditLogService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
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

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "운영 감사 로그 API")
public class AuditLogController {

    private final AuditLogService auditLogService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping
    @Operation(summary = "감사 로그 생성", description = "관리자 전용")
    public ResponseEntity<AuditLogDto> createLog(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateAuditLogRequest request
    ) {
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        AuditLogDto created = auditLogService.createLog(adminId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Operation(summary = "감사 로그 조회", description = "관리자 전용 (작업: OPS_03_audit_log_viewer - 필터 지원)")
    public ResponseEntity<Page<AuditLogDto>> getLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Long targetId,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        
        // 필터 파라미터가 있으면 필터링된 조회 사용
        if (action != null || targetType != null || targetId != null) {
            Page<AuditLogDto> logs = auditLogService.getLogsWithFilter(
                    adminId, actorId, action, targetType, targetId, pageable);
            return ResponseEntity.ok(logs);
        }
        
        // 기존 방식 (하위 호환성)
        Page<AuditLogDto> logs = auditLogService.getLogs(adminId, actorId, pageable);
        return ResponseEntity.ok(logs);
    }
}

