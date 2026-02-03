package com.audition.platform.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 영상 피드백 생성 요청
 * 작업: 2026_13_video_feedback
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVideoFeedbackRequest {
    @NotNull(message = "비디오 ID는 필수입니다")
    private Long videoId;

    @NotNull(message = "타임코드는 필수입니다")
    @Min(value = 0, message = "타임코드는 0 이상이어야 합니다")
    private Integer timestampSeconds; // 타임코드 (초 단위)

    @NotBlank(message = "피드백 내용은 필수입니다")
    private String comment;
}
