package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.RankingPageDataDto;
import com.audition.platform.application.ranking.AuditionRankingQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class RankingController {

    private final AuditionRankingQueryService auditionRankingQueryService;

    public RankingController(AuditionRankingQueryService auditionRankingQueryService) {
        this.auditionRankingQueryService = auditionRankingQueryService;
    }

    @GetMapping("/auditions/{auditionId}/ranking")
    public ApiEnvelope<RankingPageDataDto> ranking(@PathVariable UUID auditionId) {
        return ApiEnvelope.ok(auditionRankingQueryService.getRanking(auditionId));
    }
}
