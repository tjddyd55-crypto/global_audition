package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByActorId(Long actorId, Pageable pageable);
    
    // 작업: OPS_03_audit_log_viewer - 로그 필터
    Page<AuditLog> findByAction(String action, Pageable pageable);
    
    Page<AuditLog> findByTargetTypeAndTargetId(String targetType, Long targetId, Pageable pageable);
    
    Page<AuditLog> findByActorIdAndAction(Long actorId, String action, Pageable pageable);
}

