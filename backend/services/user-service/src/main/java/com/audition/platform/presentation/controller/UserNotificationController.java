package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.UserNotificationDto;
import com.audition.platform.application.service.UserNotificationService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 알림 컨트롤러
 * 작업: 2026_17_notification_system
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "User Notifications", description = "사용자 알림 API")
public class UserNotificationController {

    private final UserNotificationService userNotificationService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @GetMapping
    @Operation(summary = "알림 목록 조회")
    public ResponseEntity<Page<UserNotificationDto>> getNotifications(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<UserNotificationDto> notifications = userNotificationService.getNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    @Operation(summary = "읽지 않은 알림 목록 조회")
    public ResponseEntity<Page<UserNotificationDto>> getUnreadNotifications(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<UserNotificationDto> notifications = userNotificationService.getUnreadNotifications(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread/count")
    @Operation(summary = "읽지 않은 알림 수 조회")
    public ResponseEntity<UnreadCountDto> getUnreadCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        long count = userNotificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountDto(count));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "알림 읽음 처리")
    public ResponseEntity<UserNotificationDto> markAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        UserNotificationDto notification = userNotificationService.markAsRead(userId, id);
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/read-all")
    @Operation(summary = "모든 알림 읽음 처리")
    public ResponseEntity<Void> markAllAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        userNotificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    // DTO 클래스
    public static class UnreadCountDto {
        private long count;

        public UnreadCountDto(long count) {
            this.count = count;
        }

        public long getCount() {
            return count;
        }
    }
}
