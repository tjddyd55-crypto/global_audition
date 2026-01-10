package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateVideoRequest;
import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.service.VideoContentService;
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

@RestController
@RequestMapping("/api/v1/videos")
@RequiredArgsConstructor
@Tag(name = "Video Contents", description = "비디오 콘텐츠 관리 API")
public class VideoContentController {

    private final VideoContentService videoContentService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @Operation(summary = "비디오 목록 조회")
    public ResponseEntity<Page<VideoContentDto>> getVideos(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String sort, // popular, newest
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<VideoContentDto> videos;
        if (userId != null) {
            videos = videoContentService.getVideos(userId, pageable);
        } else if ("popular".equals(sort)) {
            videos = videoContentService.getPopularVideos(pageable);
        } else {
            videos = videoContentService.getAllVideos(pageable);
        }
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "비디오 상세 조회")
    public ResponseEntity<VideoContentDto> getVideo(@PathVariable Long id) {
        VideoContentDto video = videoContentService.getVideo(id);
        return ResponseEntity.ok(video);
    }

    @PostMapping
    @Operation(summary = "비디오 업로드")
    public ResponseEntity<VideoContentDto> createVideo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid CreateVideoRequest request
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoContentDto created = videoContentService.createVideo(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "비디오 수정")
    public ResponseEntity<VideoContentDto> updateVideo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody @Valid CreateVideoRequest request
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        VideoContentDto updated = videoContentService.updateVideo(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비디오 삭제")
    public ResponseEntity<Void> deleteVideo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        videoContentService.deleteVideo(id, userId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/my")
    @Operation(summary = "내 비디오 목록", description = "현재 로그인한 사용자의 비디오 목록")
    public ResponseEntity<Page<VideoContentDto>> getMyVideos(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        Page<VideoContentDto> videos = videoContentService.getVideos(userId, pageable);
        return ResponseEntity.ok(videos);
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "비디오 좋아요")
    public ResponseEntity<VideoContentDto> likeVideo(@PathVariable Long id) {
        VideoContentDto updated = videoContentService.incrementLikeCount(id);
        return ResponseEntity.ok(updated);
    }
}
