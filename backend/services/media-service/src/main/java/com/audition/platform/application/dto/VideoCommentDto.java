package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 영상 댓글 DTO
 * 작업: 2026_21_community_features
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoCommentDto {
    private Long id;
    private Long videoId;
    private Long userId;
    private String userName; // 내부 API로 조회
    private Long parentCommentId;
    private String content;
    private Long likeCount;
    private Boolean isLiked; // 현재 사용자가 좋아요 했는지
    private List<VideoCommentDto> replies; // 대댓글 목록
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
