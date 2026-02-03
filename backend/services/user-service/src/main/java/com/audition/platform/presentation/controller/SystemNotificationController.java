package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateSystemNotificationRequest;
import com.audition.platform.application.dto.SystemNotificationDto;
import com.audition.platform.application.service.SystemNotificationService;
import com.audition.platform.domain.entity.SystemNotification;
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
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
@Tag(name = "Admin Notifications", description = "운영 알림 API")
public class SystemNotificationController {

    private final SystemNotificationService systemNotificationService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping
    @Operation(summary = "운영 알림 생성", description = "관리자 전용")
    public ResponseEntity<SystemNotificationDto> createNotification(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateSystemNotificationRequest request
    ) {
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        SystemNotificationDto created = systemNotificationService.createNotification(adminId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Operation(summary = "운영 알림 조회", description = "관리자 전용")
    public ResponseEntity<Page<SystemNotificationDto>> getNotifications(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) SystemNotification.NotificationStatus status,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<SystemNotificationDto> notifications =
                systemNotificationService.getNotifications(adminId, status, pageable);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/ack")
    @Operation(summary = "운영 알림 확인", description = "관리자 전용")
    public ResponseEntity<SystemNotificationDto> acknowledge(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        SystemNotificationDto updated = systemNotificationService.acknowledge(adminId, id);
        return ResponseEntity.ok(updated);
    }
}

