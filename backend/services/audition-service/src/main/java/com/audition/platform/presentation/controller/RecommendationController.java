package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuditionDto;
import com.audition.platform.application.service.RecommendationService;
import com.audition.platform.application.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 추천/랭킹 컨트롤러
 * 작업: 2026_15_recommendation_ranking
 */
@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations & Rankings", description = "추천 및 랭킹 API")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final RankingService rankingService;

    @GetMapping("/auditions")
    @Operation(summary = "추천 오디션 목록", description = "지원자 수 기준 추천 오디션")
    public ResponseEntity<Page<AuditionDto>> getRecommendedAuditions(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<AuditionDto> auditions = recommendationService.getRecommendedAuditions(pageable);
        return ResponseEntity.ok(auditions);
    }

    @GetMapping("/auditions/popular")
    @Operation(summary = "인기 오디션 목록", description = "지원자 수가 많은 오디션")
    public ResponseEntity<List<AuditionDto>> getPopularAuditions(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<AuditionDto> auditions = recommendationService.getPopularAuditions(limit);
        return ResponseEntity.ok(auditions);
    }

    @GetMapping("/applicants/top-by-pass")
    @Operation(summary = "합격 수 기준 지원자 랭킹", description = "최종 합격 수가 많은 지원자")
    public ResponseEntity<List<Long>> getTopApplicantsByPassCount(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<Long> userIds = rankingService.getTopApplicantsByPassCount(limit);
        return ResponseEntity.ok(userIds);
    }

    @GetMapping("/applicants/top-by-application")
    @Operation(summary = "지원 수 기준 지원자 랭킹", description = "지원 수가 많은 지원자")
    public ResponseEntity<List<Long>> getTopApplicantsByApplicationCount(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<Long> userIds = rankingService.getTopApplicantsByApplicationCount(limit);
        return ResponseEntity.ok(userIds);
    }
}
