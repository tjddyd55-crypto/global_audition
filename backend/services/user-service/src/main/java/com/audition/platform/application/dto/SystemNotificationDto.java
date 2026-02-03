package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.SystemNotification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SystemNotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private SystemNotification.NotificationStatus status;
    private LocalDateTime acknowledgedAt;
    private Long acknowledgedBy;
    private LocalDateTime createdAt;
}

