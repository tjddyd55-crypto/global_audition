package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 영상 피드백 DTO
 * 작업: 2026_13_video_feedback
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoFeedbackDto {
    private Long id;
    private Long videoId;
    private Long userId;
    private String userName; // 내부 API로 조회
    private Integer timestampSeconds;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
