package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateFeedbackRequest {
    @NotNull(message = "트레이너 ID는 필수입니다")
    private Long instructorId;

    private String requestMessage;
}

