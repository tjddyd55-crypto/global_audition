package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreateVideoRequest;
import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.mapper.VideoContentMapper;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import com.audition.platform.infrastructure.storage.FileStorageService;
import com.audition.platform.infrastructure.youtube.YouTubeUrlValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional
public class VideoContentService {

    private final VideoContentRepository videoContentRepository;
    private final VideoContentMapper videoContentMapper;
    private final FileStorageService fileStorageService;

    /**
     * 사용자 비디오 목록 조회 (공개 범위 필터링)
     * 작업: 2026_12_personal_channel_media, 2026_16_follow_subscription
     */
    @Transactional(readOnly = true)
    public Page<VideoContentDto> getVideos(Long userId, Long requesterId, Pageable pageable) {
        // 공개 비디오 또는 팔로워만 볼 수 있는 비디오 조회
        // TODO: 팔로워 확인 로직 추가 필요 (2026_16_follow_subscription)
        Page<VideoContent> videos = videoContentRepository.findByUserIdAndStatusAndVisibility(
                userId, VideoContent.VideoStatus.PUBLISHED, VideoContent.Visibility.PUBLIC, pageable);
        return videos.map(videoContentMapper::toDto);
    }

    /**
     * 사용자 비디오 목록 조회 (기존 메서드 - 하위 호환성)
     */
    @Transactional(readOnly = true)
    public Page<VideoContentDto> getVideos(Long userId, Pageable pageable) {
        return getVideos(userId, null, pageable);
    }

    /**
     * 내 비디오 목록 조회 (모든 공개 범위)
     * 작업: 2026_12_personal_channel_media
     */
    @Transactional(readOnly = true)
    public Page<VideoContentDto> getMyVideos(Long userId, Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findByUserIdAndStatus(
                userId, VideoContent.VideoStatus.PUBLISHED, pageable);
        return videos.map(videoContentMapper::toDto);
    }

    /**
     * 전체 공개 비디오 목록 조회
     * 작업: 2026_12_personal_channel_media - 공개 범위 필터링
     */
    @Transactional(readOnly = true)
    public Page<VideoContentDto> getAllVideos(Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findByStatusAndVisibility(
                VideoContent.VideoStatus.PUBLISHED, VideoContent.Visibility.PUBLIC, pageable);
        return videos.map(videoContentMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<VideoContentDto> getPopularVideos(Pageable pageable) {
        Page<VideoContent> videos = videoContentRepository.findPopularVideos(pageable);
        return videos.map(videoContentMapper::toDto);
    }

    /**
     * 비디오 상세 조회 (MVP_03: 공개 범위 및 삭제 상태 검증)
     */
    @Transactional(readOnly = true)
    public VideoContentDto getVideo(Long id, Long requesterId) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + id));
        
        // MVP_03: 삭제된 영상 조회 시 404
        if (video.getStatus() == VideoContent.VideoStatus.DELETED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + id);
        }
        
        // MVP_03: 공개 범위 검증
        VideoContent.Visibility visibility = video.getVisibility();
        if (visibility == null) {
            visibility = VideoContent.Visibility.PUBLIC; // 기본값
        }
        
        if (visibility == VideoContent.Visibility.PRIVATE) {
            // PRIVATE: 소유자만 조회 가능 (ADMIN은 향후 확장 가능)
            if (requesterId == null || !requesterId.equals(video.getUserId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비공개 영상입니다");
            }
        }
        // PUBLIC, FOLLOWERS_ONLY: 조회 가능 (FOLLOWERS_ONLY는 향후 확장)
        
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

    /**
     * 비디오 상세 조회 (기존 메서드 - 하위 호환성)
     */
    @Transactional(readOnly = true)
    public VideoContentDto getVideo(Long id) {
        return getVideo(id, null);
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
                .videoType(request.getVideoType() != null ? request.getVideoType() : VideoContent.VideoType.ORIGINAL)
                .visibility(request.getVisibility() != null ? request.getVisibility() : VideoContent.Visibility.PUBLIC)
                .status(request.getStatus())
                .build();

        VideoContent saved = videoContentRepository.save(video);
        VideoContentDto dto = videoContentMapper.toDto(saved);
        // YouTube 임베드 URL 추가
        dto.setEmbedUrl(YouTubeUrlValidator.generateEmbedUrl(videoId));
        return dto;
    }

    /**
     * 비디오 수정 (MVP_03: 소유자만 수정 가능, 403 반환)
     */
    public VideoContentDto updateVideo(Long id, Long userId, CreateVideoRequest request) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + id));

        // MVP_03: 삭제된 영상 수정 불가
        if (video.getStatus() == VideoContent.VideoStatus.DELETED) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + id);
        }

        // MVP_03: 소유자만 수정 가능 (403 반환)
        if (!video.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to update this video");
        }

        if (request.getTitle() != null) video.setTitle(request.getTitle());
        if (request.getDescription() != null) video.setDescription(request.getDescription());
        if (request.getThumbnailUrl() != null) video.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getCategory() != null) video.setCategory(request.getCategory());
        if (request.getVideoType() != null) video.setVideoType(request.getVideoType());
        if (request.getVisibility() != null) video.setVisibility(request.getVisibility());
        if (request.getStatus() != null) video.setStatus(request.getStatus());

        VideoContent updated = videoContentRepository.save(video);
        return videoContentMapper.toDto(updated);
    }

    /**
     * 비디오 삭제 (MVP_03: 소유자만 삭제 가능, 403 반환)
     */
    public void deleteVideo(Long id, Long userId) {
        VideoContent video = videoContentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found: " + id));

        // MVP_03: 소유자만 삭제 가능 (403 반환)
        if (!video.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this video");
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

    /**
     * 비디오 파일 업로드 (실제 파일)
     * 작업: 2026_12_personal_channel_media
     */
    public VideoContentDto uploadVideoFile(Long userId, MultipartFile file, String title, String description, 
                                          String category, String videoType, String visibility) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 없습니다");
        }

        try {
            // 파일 업로드
            String videoUrl = fileStorageService.uploadVideo(file, userId);
            
            // VideoContent 엔티티 생성 (실제 환경에서는 비디오 트랜스코딩 후 URL 업데이트)
            VideoContent.VideoType videoTypeEnum = null;
            if (videoType != null && !videoType.isEmpty()) {
                try {
                    videoTypeEnum = VideoContent.VideoType.valueOf(videoType.toUpperCase());
                } catch (IllegalArgumentException e) {
                    videoTypeEnum = VideoContent.VideoType.ORIGINAL;
                }
            } else {
                videoTypeEnum = VideoContent.VideoType.ORIGINAL;
            }

            VideoContent.Visibility visibilityEnum = null;
            if (visibility != null && !visibility.isEmpty()) {
                try {
                    visibilityEnum = VideoContent.Visibility.valueOf(visibility.toUpperCase());
                } catch (IllegalArgumentException e) {
                    visibilityEnum = VideoContent.Visibility.PUBLIC;
                }
            } else {
                visibilityEnum = VideoContent.Visibility.PUBLIC;
            }

            VideoContent video = VideoContent.builder()
                    .userId(userId)
                    .title(title != null ? title : file.getOriginalFilename())
                    .description(description)
                    .videoUrl(videoUrl)
                    .thumbnailUrl(null) // 실제 환경에서는 비디오에서 썸네일 추출
                    .category(category != null && !category.isEmpty() ? VideoContent.VideoCategory.valueOf(category) : VideoContent.VideoCategory.SINGER)
                    .videoType(videoTypeEnum)
                    .visibility(visibilityEnum)
                    .status(VideoContent.VideoStatus.PUBLISHED)
                    .build();

            VideoContent saved = videoContentRepository.save(video);
            return videoContentMapper.toDto(saved);
        } catch (Exception e) {
            throw new RuntimeException("비디오 업로드 실패: " + e.getMessage(), e);
        }
    }
}
