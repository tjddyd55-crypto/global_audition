package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSystemNotificationRequest {
    @NotBlank(message = "type은 필수입니다")
    private String type;

    @NotBlank(message = "title은 필수입니다")
    private String title;

    @NotBlank(message = "message는 필수입니다")
    private String message;
}

