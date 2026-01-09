package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateVideoRequest;
import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.service.VideoContentService;
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
            @RequestBody @Valid CreateVideoRequest request
    ) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        VideoContentDto created = videoContentService.createVideo(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "비디오 수정")
    public ResponseEntity<VideoContentDto> updateVideo(
            @PathVariable Long id,
            @RequestBody @Valid CreateVideoRequest request
    ) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        VideoContentDto updated = videoContentService.updateVideo(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "비디오 삭제")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long id) {
        Long userId = 1L; // TODO: 실제 사용자 ID로 변경
        videoContentService.deleteVideo(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "비디오 좋아요")
    public ResponseEntity<VideoContentDto> likeVideo(@PathVariable Long id) {
        VideoContentDto updated = videoContentService.incrementLikeCount(id);
        return ResponseEntity.ok(updated);
    }
}
