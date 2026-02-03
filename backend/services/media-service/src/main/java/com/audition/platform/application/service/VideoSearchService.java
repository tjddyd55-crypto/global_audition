package com.audition.platform.application.service;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.mapper.VideoContentMapper;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 영상 검색 서비스
 * 작업: 2026_19_search_discovery
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class VideoSearchService {

    private final VideoContentRepository videoContentRepository;
    private final VideoContentMapper videoContentMapper;

    /**
     * 영상 검색
     */
    public Page<VideoContentDto> searchVideos(String keyword, String category, String videoType, Pageable pageable) {
        Specification<VideoContent> spec = Specification.where(null);

        // 공개 영상만
        spec = spec.and((root, query, cb) -> 
            cb.and(
                cb.equal(root.get("status"), VideoContent.VideoStatus.PUBLISHED),
                cb.equal(root.get("visibility"), VideoContent.Visibility.PUBLIC)
            )
        );

        // 키워드 검색 (제목, 설명)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String searchKeyword = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("title")), searchKeyword),
                    cb.like(cb.lower(root.get("description")), searchKeyword)
                )
            );
        }

        // 카테고리 필터
        if (category != null && !category.trim().isEmpty()) {
            try {
                VideoContent.VideoCategory categoryEnum = VideoContent.VideoCategory.valueOf(category.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), categoryEnum));
            } catch (IllegalArgumentException e) {
                log.warn("올바르지 않은 카테고리: {}", category);
            }
        }

        // 비디오 타입 필터
        if (videoType != null && !videoType.trim().isEmpty()) {
            try {
                VideoContent.VideoType videoTypeEnum = VideoContent.VideoType.valueOf(videoType.toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("videoType"), videoTypeEnum));
            } catch (IllegalArgumentException e) {
                log.warn("올바르지 않은 비디오 타입: {}", videoType);
            }
        }

        Page<VideoContent> videos = videoContentRepository.findAll(spec, pageable);
        return videos.map(videoContentMapper::toDto);
    }
}
