package com.audition.platform.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDto {
    private Long id;
    private Long actorId;
    private String action;
    private String targetType;
    private Long targetId;
    private String message;
    private String metadata;
    private LocalDateTime createdAt;
}

