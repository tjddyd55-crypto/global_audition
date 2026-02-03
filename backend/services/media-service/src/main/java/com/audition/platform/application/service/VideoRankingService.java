package com.audition.platform.application.service;

import com.audition.platform.application.dto.VideoContentDto;
import com.audition.platform.application.mapper.VideoContentMapper;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import com.audition.platform.domain.repository.VideoFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 영상 랭킹 서비스
 * 작업: 2026_15_recommendation_ranking
 * 
 * 영상 랭킹 기준:
 * - 조회수 (viewCount)
 * - 좋아요 수 (likeCount)
 * - 피드백 수 (feedbackCount)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class VideoRankingService {

    private final VideoContentRepository videoContentRepository;
    private final VideoFeedbackRepository videoFeedbackRepository;
    private final VideoContentMapper videoContentMapper;

    /**
     * 인기 영상 랭킹 조회 (조회수 + 좋아요 수 기준)
     */
    public Page<VideoContentDto> getPopularVideos(Pageable pageable) {
        // 조회수와 좋아요 수를 합산한 점수로 정렬
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "viewCount", "likeCount")
        );

        Page<VideoContent> videos = videoContentRepository.findByStatusAndVisibility(
                VideoContent.VideoStatus.PUBLISHED,
                VideoContent.Visibility.PUBLIC,
                sortedPageable
        );
        
        log.debug("인기 영상 랭킹 조회: {}개", videos.getTotalElements());
        
        return videos.map(videoContentMapper::toDto);
    }

    /**
     * 피드백 수 기준 영상 랭킹
     */
    public List<VideoContentDto> getTopVideosByFeedbackCount(int limit) {
        List<VideoContent> videos = videoContentRepository.findByStatusAndVisibility(
                VideoContent.VideoStatus.PUBLISHED,
                VideoContent.Visibility.PUBLIC,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        
        List<VideoContent> sorted = videos.stream()
                .sorted((v1, v2) -> {
                    long count1 = videoFeedbackRepository.countByVideoId(v1.getId());
                    long count2 = videoFeedbackRepository.countByVideoId(v2.getId());
                    return Long.compare(count2, count1);
                })
                .limit(limit)
                .collect(Collectors.toList());
        
        return sorted.stream()
                .map(videoContentMapper::toDto)
                .collect(Collectors.toList());
    }
}
