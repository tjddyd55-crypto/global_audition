package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateVideoRequest;
import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.mapper.VideoContentMapper;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import com.audition.platform.infrastructure.youtube.YouTubeUrlValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class VideoContentService {

    private final VideoContentRepository videoContentRepository;
    private final VideoContentMapper videoContentMapper;

    @Transactional(readOnly = true)
    public Page<VideoContentDto> getVideos(Long userId, Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findByUserIdAndStatus(
                userId, VideoContent.VideoStatus.PUBLISHED, pageable);
        return videos.map(videoContentMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<VideoContentDto> getAllVideos(Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findByStatus(
                VideoContent.VideoStatus.PUBLISHED, pageable);
        return videos.map(videoContentMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<VideoContentDto> getPopularVideos(Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findPopularVideos(pageable);
        return videos.map(videoContentMapper::toDto);
    }

    @Transactional(readOnly = true)
    public VideoContentDto getVideo(Long id) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found: " + id));
        
        // 조회수 증가
        video.setViewCount(video.getViewCount() + 1);
        videoContentRepository.save(video);
        
        VideoContentDto dto = videoContentMapper.toDto(video);
        // YouTube 임베드 URL 추가
        if (YouTubeUrlValidator.isValidYouTubeUrl(video.getVideoUrl())) {
            String videoId = YouTubeUrlValidator.extractVideoId(video.getVideoUrl());
            dto.setEmbedUrl(YouTubeUrlValidator.generateEmbedUrl(videoId));
        }
        return dto;
    }

    public VideoContentDto createVideo(Long userId, CreateVideoRequest request) {
        // YouTube URL 검증
        if (!YouTubeUrlValidator.isValidYouTubeUrl(request.getVideoUrl())) {
            throw new IllegalArgumentException("유효한 YouTube URL이 아닙니다: " + request.getVideoUrl());
        }

        // YouTube 영상 ID 추출
        String videoId = YouTubeUrlValidator.extractVideoId(request.getVideoUrl());
        
        // 썸네일 URL 자동 생성 (제공되지 않은 경우)
        String thumbnailUrl = request.getThumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.trim().isEmpty()) {
            thumbnailUrl = YouTubeUrlValidator.generateThumbnailUrl(videoId);
        }

        VideoContent video = VideoContent.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .videoUrl(request.getVideoUrl())
                .thumbnailUrl(thumbnailUrl)
                .duration(request.getDuration())
                .category(request.getCategory())
                .status(request.getStatus())
                .build();

        VideoContent saved = videoContentRepository.save(video);
        VideoContentDto dto = videoContentMapper.toDto(saved);
        // YouTube 임베드 URL 추가
        dto.setEmbedUrl(YouTubeUrlValidator.generateEmbedUrl(videoId));
        return dto;
    }

    public VideoContentDto updateVideo(Long id, Long userId, CreateVideoRequest request) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found: " + id));

        if (!video.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this video");
        }

        if (request.getTitle() != null) video.setTitle(request.getTitle());
        if (request.getDescription() != null) video.setDescription(request.getDescription());
        if (request.getThumbnailUrl() != null) video.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getCategory() != null) video.setCategory(request.getCategory());
        if (request.getStatus() != null) video.setStatus(request.getStatus());

        VideoContent updated = videoContentRepository.save(video);
        return videoContentMapper.toDto(updated);
    }

    public void deleteVideo(Long id, Long userId) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found: " + id));

        if (!video.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this video");
        }

        video.setStatus(VideoContent.VideoStatus.DELETED);
        videoContentRepository.save(video);
    }

    public VideoContentDto incrementLikeCount(Long id) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found: " + id));
        
        video.setLikeCount(video.getLikeCount() + 1);
        VideoContent updated = videoContentRepository.save(video);
        return videoContentMapper.toDto(updated);
    }
}
