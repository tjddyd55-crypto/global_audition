package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.UserNotification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 알림 DTO
 * 작업: 2026_17_notification_system
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationDto {
    private Long id;
    private Long userId;
    private UserNotification.NotificationType notificationType;
    private String title;
    private String message;
    private Long relatedId;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
