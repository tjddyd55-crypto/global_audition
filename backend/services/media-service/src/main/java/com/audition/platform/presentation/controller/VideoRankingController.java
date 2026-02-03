package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.service.VideoRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 영상 랭킹 컨트롤러
 * 작업: 2026_15_recommendation_ranking
 */
@RestController
@RequestMapping("/api/v1/videos/ranking")
@RequiredArgsConstructor
@Tag(name = "Video Rankings", description = "영상 랭킹 API")
public class VideoRankingController {

    private final VideoRankingService videoRankingService;

    @GetMapping("/popular")
    @Operation(summary = "인기 영상 랭킹", description = "조회수 + 좋아요 수 기준")
    public ResponseEntity<Page<VideoContentDto>> getPopularVideos(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<VideoContentDto> videos = videoRankingService.getPopularVideos(pageable);
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/by-feedback")
    @Operation(summary = "피드백 수 기준 영상 랭킹", description = "피드백이 많은 영상")
    public ResponseEntity<List<VideoContentDto>> getTopVideosByFeedback(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<VideoContentDto> videos = videoRankingService.getTopVideosByFeedbackCount(limit);
        return ResponseEntity.ok(videos);
    }
}
