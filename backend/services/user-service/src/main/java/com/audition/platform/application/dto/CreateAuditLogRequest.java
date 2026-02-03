package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAuditLogRequest {
    @NotBlank(message = "action은 필수입니다")
    private String action;

    private String targetType;
    private Long targetId;
    private String message;
    private String metadata;
}

