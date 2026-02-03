package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateVideoFeedbackRequest;
import com.audition.platform.application.dto.VideoFeedbackDto;
import com.audition.platform.application.service.VideoFeedbackService;
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

import java.util.List;

/**
 * 영상 피드백 컨트롤러
 * 작업: 2026_13_video_feedback
 */
@RestController
@RequestMapping("/api/v1/videos/feedback")
@RequiredArgsConstructor
@Tag(name = "Video Feedback", description = "영상 타임코드 기반 피드백 API")
public class VideoFeedbackController {

    private final VideoFeedbackService videoFeedbackService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @Operation(summary = "피드백 생성", description = "타임코드 기반 피드백 작성")
    public ResponseEntity<VideoFeedbackDto> createFeedback(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateVideoFeedbackRequest request
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoFeedbackDto feedback = videoFeedbackService.createFeedback(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(feedback);
    }

    @GetMapping("/video/{videoId}")
    @Operation(summary = "비디오별 피드백 목록 조회", description = "타임코드 순으로 정렬")
    public ResponseEntity<List<VideoFeedbackDto>> getFeedbackByVideo(
            @PathVariable Long videoId
    ) {
        List<VideoFeedbackDto> feedbacks = videoFeedbackService.getFeedbackByVideo(videoId);
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/video/{videoId}/page")
    @Operation(summary = "비디오별 피드백 목록 조회 (페이지네이션)")
    public ResponseEntity<Page<VideoFeedbackDto>> getFeedbackByVideoPage(
            @PathVariable Long videoId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<VideoFeedbackDto> feedbacks = videoFeedbackService.getFeedbackByVideo(videoId, pageable);
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/video/{videoId}/range")
    @Operation(summary = "특정 시간 범위의 피드백 조회")
    public ResponseEntity<List<VideoFeedbackDto>> getFeedbackByTimeRange(
            @PathVariable Long videoId,
            @RequestParam Integer startTime,
            @RequestParam Integer endTime
    ) {
        List<VideoFeedbackDto> feedbacks = videoFeedbackService.getFeedbackByTimeRange(
                videoId, startTime, endTime);
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/my")
    @Operation(summary = "내 피드백 히스토리 조회")
    public ResponseEntity<Page<VideoFeedbackDto>> getMyFeedbackHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<VideoFeedbackDto> feedbacks = videoFeedbackService.getFeedbackHistory(userId, pageable);
        return ResponseEntity.ok(feedbacks);
    }

    @PutMapping("/{id}")
    @Operation(summary = "피드백 수정")
    public ResponseEntity<VideoFeedbackDto> updateFeedback(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody String comment
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoFeedbackDto updated = videoFeedbackService.updateFeedback(id, userId, comment);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "피드백 삭제")
    public ResponseEntity<Void> deleteFeedback(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        videoFeedbackService.deleteFeedback(id, userId);
        return ResponseEntity.noContent().build();
    }
}
