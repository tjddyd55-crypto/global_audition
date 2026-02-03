package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateSystemNotificationRequest;
import com.audition.platform.application.dto.SystemNotificationDto;
import com.audition.platform.domain.entity.SystemNotification;
import com.audition.platform.domain.repository.SystemNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemNotificationService {

    private final SystemNotificationRepository systemNotificationRepository;
    private final UserRoleValidator userRoleValidator;

    public SystemNotificationDto createNotification(Long adminId, CreateSystemNotificationRequest request) {
        userRoleValidator.requireAdmin(adminId);

        SystemNotification notification = SystemNotification.builder()
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .status(SystemNotification.NotificationStatus.NEW)
                .build();

        SystemNotification saved = systemNotificationRepository.save(notification);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SystemNotificationDto> getNotifications(
            Long adminId,
            SystemNotification.NotificationStatus status,
            Pageable pageable
    ) {
        userRoleValidator.requireAdmin(adminId);
        if (status != null) {
            return systemNotificationRepository.findByStatus(status, pageable)
                    .map(this::toDto);
        }
        return systemNotificationRepository.findAll(pageable)
                .map(this::toDto);
    }

    public SystemNotificationDto acknowledge(Long adminId, Long notificationId) {
        userRoleValidator.requireAdmin(adminId);

        SystemNotification notification = systemNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        notification.setStatus(SystemNotification.NotificationStatus.ACKED);
        notification.setAcknowledgedAt(LocalDateTime.now());
        notification.setAcknowledgedBy(adminId);

        SystemNotification saved = systemNotificationRepository.save(notification);
        return toDto(saved);
    }

    private SystemNotificationDto toDto(SystemNotification notification) {
        return SystemNotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .acknowledgedAt(notification.getAcknowledgedAt())
                .acknowledgedBy(notification.getAcknowledgedBy())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

