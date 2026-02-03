package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.FeedbackSession;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFeedbackStatusRequest {
    @NotNull(message = "상태는 필수입니다")
    private FeedbackSession.FeedbackStatus status;

    private String responseMessage;
}

