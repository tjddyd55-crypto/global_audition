package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreatorAnalyticsDto;
import com.audition.platform.application.service.CreatorAnalyticsService;
import com.audition.platform.infrastructure.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 크리에이터 분석 컨트롤러
 * 작업: 2026_20_creator_analytics
 */
@RestController
@RequestMapping("/api/v1/analytics/creator")
@RequiredArgsConstructor
@Tag(name = "Creator Analytics", description = "크리에이터 분석 API")
public class CreatorAnalyticsController {

    private final CreatorAnalyticsService creatorAnalyticsService;
    private final SecurityUtils securityUtils;

    @GetMapping("/my")
    @Operation(summary = "내 크리에이터 통계", description = "조회수, 좋아요, 피드백 통계 및 채널 성장 그래프")
    public ResponseEntity<CreatorAnalyticsDto> getMyAnalytics(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = securityUtils.getUserIdFromAuthHeaderOrThrow(authHeader);
        CreatorAnalyticsDto analytics = creatorAnalyticsService.getCreatorAnalytics(userId);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "크리에이터 통계 조회", description = "특정 사용자의 크리에이터 통계 (공개 정보만)")
    public ResponseEntity<CreatorAnalyticsDto> getCreatorAnalytics(@PathVariable Long userId) {
        CreatorAnalyticsDto analytics = creatorAnalyticsService.getCreatorAnalytics(userId);
        return ResponseEntity.ok(analytics);
    }
}
