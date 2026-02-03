package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateCommentRequest;
import com.audition.platform.application.dto.VideoCommentDto;
import com.audition.platform.application.service.VideoCommentService;
import com.audition.platform.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 영상 댓글 컨트롤러
 * 작업: 2026_21_community_features
 */
@RestController
@RequestMapping("/api/v1/videos/{videoId}/comments")
@RequiredArgsConstructor
@Tag(name = "Video Comments", description = "영상 댓글 API")
public class VideoCommentController {

    private final VideoCommentService videoCommentService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @Operation(summary = "댓글 작성")
    public ResponseEntity<VideoCommentDto> createComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long videoId,
            @RequestBody @Valid CreateCommentRequest request
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        request.setVideoId(videoId); // path variable로 설정
        VideoCommentDto comment = videoCommentService.createComment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping
    @Operation(summary = "댓글 목록 조회")
    public ResponseEntity<Page<VideoCommentDto>> getComments(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long videoId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long requesterId = securityUtils.getUserIdFromAuthHeader(authHeader);
        Page<VideoCommentDto> comments = videoCommentService.getComments(videoId, requesterId, pageable);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "댓글 삭제")
    public ResponseEntity<Void> deleteComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long videoId,
            @PathVariable Long commentId
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        videoCommentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{commentId}/like")
    @Operation(summary = "댓글 좋아요")
    public ResponseEntity<VideoCommentDto> likeComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long videoId,
            @PathVariable Long commentId
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoCommentDto comment = videoCommentService.likeComment(commentId, userId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{commentId}/like")
    @Operation(summary = "댓글 좋아요 취소")
    public ResponseEntity<VideoCommentDto> unlikeComment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long videoId,
            @PathVariable Long commentId
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoCommentDto comment = videoCommentService.unlikeComment(commentId, userId);
        return ResponseEntity.ok(comment);
    }
}
