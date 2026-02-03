package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 댓글 생성 요청
 * 작업: 2026_21_community_features
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommentRequest {
    @NotNull(message = "비디오 ID는 필수입니다")
    private Long videoId;

    private Long parentCommentId; // 대댓글인 경우

    @NotBlank(message = "댓글 내용은 필수입니다")
    private String content;
}
