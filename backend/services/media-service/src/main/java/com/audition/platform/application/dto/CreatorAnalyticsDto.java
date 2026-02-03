package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 크리에이터 분석 DTO
 * 작업: 2026_20_creator_analytics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorAnalyticsDto {
    private Long userId;
    private long totalViews;      // 전체 조회수
    private long totalLikes;      // 전체 좋아요 수
    private long totalFeedbacks;  // 전체 피드백 수
    private int videoCount;       // 영상 수
    private Map<String, Long> viewsByDate; // 날짜별 조회수 (최근 30일)
}
