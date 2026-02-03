package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 사용자 알림 Repository
 * 작업: 2026_17_notification_system
 */
@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    
    Page<UserNotification> findByUserId(Long userId, Pageable pageable);
    
    Page<UserNotification> findByUserIdAndIsRead(Long userId, Boolean isRead, Pageable pageable);
    
    Page<UserNotification> findByUserIdAndNotificationType(Long userId, UserNotification.NotificationType type, Pageable pageable);
    
    long countByUserIdAndIsRead(Long userId, Boolean isRead);
}
