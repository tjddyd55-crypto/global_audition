package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreatorAnalyticsDto;
import com.audition.platform.domain.entity.VideoContent;
import com.audition.platform.domain.repository.VideoContentRepository;
import com.audition.platform.domain.repository.VideoFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 크리에이터 분석 서비스
 * 작업: 2026_20_creator_analytics
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class CreatorAnalyticsService {

    private final VideoContentRepository videoContentRepository;
    private final VideoFeedbackRepository videoFeedbackRepository;

    /**
     * 크리에이터 통계 조회
     */
    public CreatorAnalyticsDto getCreatorAnalytics(Long userId) {
        // 사용자의 모든 영상 조회
        List<VideoContent> videos = videoContentRepository.findByUserId(userId, 
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();

        // 전체 조회수 합계
        long totalViews = videos.stream()
                .mapToLong(v -> v.getViewCount() != null ? v.getViewCount() : 0L)
                .sum();

        // 전체 좋아요 수 합계
        long totalLikes = videos.stream()
                .mapToLong(v -> v.getLikeCount() != null ? v.getLikeCount() : 0L)
                .sum();

        // 전체 피드백 수 합계
        long totalFeedbacks = videos.stream()
                .mapToLong(v -> videoFeedbackRepository.countByVideoId(v.getId()))
                .sum();

        // 영상 수
        int videoCount = videos.size();

        // 최근 30일 조회수 추이 (간단한 구현)
        Map<String, Long> viewsByDate = calculateViewsByDate(videos, 30);

        return CreatorAnalyticsDto.builder()
                .userId(userId)
                .totalViews(totalViews)
                .totalLikes(totalLikes)
                .totalFeedbacks(totalFeedbacks)
                .videoCount(videoCount)
                .viewsByDate(viewsByDate)
                .build();
    }

    /**
     * 날짜별 조회수 계산 (최근 N일)
     */
    private Map<String, Long> calculateViewsByDate(List<VideoContent> videos, int days) {
        Map<String, Long> viewsByDate = new HashMap<>();
        
        LocalDate today = LocalDate.now();
        for (int i = 0; i < days; i++) {
            LocalDate date = today.minusDays(i);
            String dateKey = date.toString();
            viewsByDate.put(dateKey, 0L);
        }

        // 간단한 구현: 영상 생성일 기준으로 조회수 분배 (실제로는 조회 로그가 필요)
        for (VideoContent video : videos) {
            if (video.getCreatedAt() != null) {
                LocalDate createdDate = video.getCreatedAt().toLocalDate();
                String dateKey = createdDate.toString();
                if (viewsByDate.containsKey(dateKey)) {
                    long currentViews = viewsByDate.get(dateKey);
                    viewsByDate.put(dateKey, currentViews + (video.getViewCount() != null ? video.getViewCount() : 0L));
                }
            }
        }

        return viewsByDate;
    }
}
