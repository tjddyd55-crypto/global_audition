package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.service.VideoSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 영상 검색 컨트롤러
 * 작업: 2026_19_search_discovery
 */
@RestController
@RequestMapping("/api/v1/search/videos")
@RequiredArgsConstructor
@Tag(name = "Video Search", description = "영상 검색 API")
public class VideoSearchController {

    private final VideoSearchService videoSearchService;

    @GetMapping
    @Operation(summary = "영상 검색", description = "키워드, 카테고리, 비디오 타입으로 영상 검색")
    public ResponseEntity<Page<VideoContentDto>> searchVideos(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category, // SINGER, DANCER, ACTOR, MODEL, INSTRUMENT
            @RequestParam(required = false) String videoType, // ORIGINAL, COMPOSITION, COVER
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<VideoContentDto> videos = videoSearchService.searchVideos(keyword, category, videoType, pageable);
        return ResponseEntity.ok(videos);
    }
}
