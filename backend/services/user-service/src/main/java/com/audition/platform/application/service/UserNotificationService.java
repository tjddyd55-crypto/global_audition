package com.audition.platform.application.service;

import com.audition.platform.application.dto.UserNotificationDto;
import com.audition.platform.domain.entity.UserNotification;
import com.audition.platform.domain.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 사용자 알림 서비스
 * 작업: 2026_17_notification_system
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserNotificationService {

    private final UserNotificationRepository userNotificationRepository;

    /**
     * 알림 생성
     */
    public UserNotificationDto createNotification(
            Long userId,
            UserNotification.NotificationType type,
            String title,
            String message,
            Long relatedId
    ) {
        UserNotification notification = UserNotification.builder()
                .userId(userId)
                .notificationType(type)
                .title(title)
                .message(message)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        UserNotification saved = userNotificationRepository.save(notification);
        log.info("알림 생성: notificationId={}, userId={}, type={}", saved.getId(), userId, type);
        return toDto(saved);
    }

    /**
     * 오디션 결과 알림 생성
     */
    public void createAuditionResultNotification(Long userId, Long auditionId, String result) {
        String title = "오디션 결과 알림";
        String message = String.format("오디션 결과가 발표되었습니다. 결과: %s", result);
        createNotification(userId, UserNotification.NotificationType.AUDITION_RESULT, title, message, auditionId);
    }

    /**
     * 피드백 알림 생성
     */
    public void createFeedbackNotification(Long userId, Long videoId, String evaluatorName) {
        String title = "새로운 피드백";
        String message = String.format("%s님이 영상에 피드백을 남겼습니다.", evaluatorName);
        createNotification(userId, UserNotification.NotificationType.FEEDBACK, title, message, videoId);
    }

    /**
     * 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<UserNotificationDto> getNotifications(Long userId, Pageable pageable) {
        Page<UserNotification> notifications = userNotificationRepository.findByUserId(
                userId, pageable);
        return notifications.map(this::toDto);
    }

    /**
     * 읽지 않은 알림 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<UserNotificationDto> getUnreadNotifications(Long userId, Pageable pageable) {
        Page<UserNotification> notifications = userNotificationRepository.findByUserIdAndIsRead(
                userId, false, pageable);
        return notifications.map(this::toDto);
    }

    /**
     * 알림 읽음 처리
     */
    public UserNotificationDto markAsRead(Long userId, Long notificationId) {
        UserNotification notification = userNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("본인의 알림만 읽을 수 있습니다");
        }

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        UserNotification saved = userNotificationRepository.save(notification);
        return toDto(saved);
    }

    /**
     * 모든 알림 읽음 처리
     */
    public void markAllAsRead(Long userId) {
        Page<UserNotification> unreadNotifications = userNotificationRepository.findByUserIdAndIsRead(
                userId, false, org.springframework.data.domain.Pageable.unpaged());

        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.getContent().forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(now);
        });

        userNotificationRepository.saveAll(unreadNotifications.getContent());
        log.info("모든 알림 읽음 처리: userId={}, count={}", userId, unreadNotifications.getTotalElements());
    }

    /**
     * 읽지 않은 알림 수 조회
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return userNotificationRepository.countByUserIdAndIsRead(userId, false);
    }

    private UserNotificationDto toDto(UserNotification notification) {
        return UserNotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .notificationType(notification.getNotificationType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .relatedId(notification.getRelatedId())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
