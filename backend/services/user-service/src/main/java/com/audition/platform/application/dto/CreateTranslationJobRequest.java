package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTranslationJobRequest {
    @NotBlank(message = "resourceType은 필수입니다")
    private String resourceType;

    @NotNull(message = "resourceId는 필수입니다")
    private Long resourceId;

    @NotBlank(message = "sourceLocale은 필수입니다")
    private String sourceLocale;

    @NotBlank(message = "targetLocale은 필수입니다")
    private String targetLocale;

    @NotBlank(message = "sourceText는 필수입니다")
    private String sourceText;

    private String provider;
}

