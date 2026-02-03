package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.SystemNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    Page<SystemNotification> findByStatus(SystemNotification.NotificationStatus status, Pageable pageable);
}

