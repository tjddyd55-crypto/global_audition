package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuditLogDto;
import com.audition.platform.application.dto.CreateAuditLogRequest;
import com.audition.platform.domain.entity.AuditLog;
import com.audition.platform.domain.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRoleValidator userRoleValidator;

    public AuditLogDto createLog(Long adminId, CreateAuditLogRequest request) {
        userRoleValidator.requireAdmin(adminId);

        AuditLog log = AuditLog.builder()
                .actorId(adminId)
                .action(request.getAction())
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .message(request.getMessage())
                .metadata(request.getMetadata())
                .build();

        AuditLog saved = auditLogRepository.save(log);
        return toDto(saved);
    }

    public void appendAdminRequestLog(Long adminId, String action, String message, String metadata) {
        userRoleValidator.requireAdmin(adminId);

        AuditLog log = AuditLog.builder()
                .actorId(adminId)
                .action(action)
                .message(message)
                .metadata(metadata)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getLogs(Long adminId, Long actorId, Pageable pageable) {
        userRoleValidator.requireAdmin(adminId);
        if (actorId != null) {
            return auditLogRepository.findByActorId(actorId, pageable)
                    .map(this::toDto);
        }
        return auditLogRepository.findAll(pageable)
                .map(this::toDto);
    }

    /**
     * 감사 로그 조회 (필터링 지원)
     * 작업: OPS_03_audit_log_viewer
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getLogsWithFilter(
            Long adminId,
            Long actorId, 
            String action, 
            String targetType, 
            Long targetId,
            Pageable pageable
    ) {
        userRoleValidator.requireAdmin(adminId);
        
        Page<AuditLog> logs;
        
        if (actorId != null && action != null) {
            logs = auditLogRepository.findByActorIdAndAction(actorId, action, pageable);
        } else if (targetType != null && targetId != null) {
            logs = auditLogRepository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
        } else if (action != null) {
            logs = auditLogRepository.findByAction(action, pageable);
        } else if (actorId != null) {
            logs = auditLogRepository.findByActorId(actorId, pageable);
        } else {
            logs = auditLogRepository.findAll(pageable);
        }
        
        return logs.map(this::toDto);
    }

    private AuditLogDto toDto(AuditLog log) {
        return AuditLogDto.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .message(log.getMessage())
                .metadata(log.getMetadata())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

