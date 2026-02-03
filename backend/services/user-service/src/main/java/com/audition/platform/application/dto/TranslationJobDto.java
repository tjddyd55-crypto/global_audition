package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.TranslationJob;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TranslationJobDto {
    private Long id;
    private String resourceType;
    private Long resourceId;
    private String sourceLocale;
    private String targetLocale;
    private String sourceText;
    private String translatedText;
    private TranslationJob.TranslationStatus status;
    private String provider;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

