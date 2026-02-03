package com.audition.platform.presentation.controller;

import com.audition.platform.application.service.UserNotificationService;
import com.audition.platform.domain.entity.UserNotification;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 내부 알림 API (다른 서비스에서 호출)
 * 작업: 2026_17_notification_system
 */
@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
public class InternalNotificationController {

    private final UserNotificationService userNotificationService;

    @PostMapping
    public ResponseEntity<Void> createNotification(@RequestBody CreateNotificationRequest request) {
        UserNotification.NotificationType type;
        try {
            type = UserNotification.NotificationType.valueOf(request.getType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("올바른 알림 타입이 아닙니다: " + request.getType());
        }

        userNotificationService.createNotification(
                request.getUserId(),
                type,
                request.getTitle(),
                request.getMessage(),
                request.getRelatedId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Data
    private static class CreateNotificationRequest {
        private Long userId;
        private String type;
        private String title;
        private String message;
        private Long relatedId;
    }
}
