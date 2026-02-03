package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.FeedbackSession;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FeedbackSessionDto {
    private Long id;
    private Long applicantId;
    private Long instructorId;
    private String requestMessage;
    private String responseMessage;
    private FeedbackSession.FeedbackStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

