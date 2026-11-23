package com.audition.platform.api;

import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.api.dto.recommend.AuditionRecommendationResponse;
import com.audition.platform.application.recommend.AuditionRecommendationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auditions")
public class AuditionRecommendationController {

    private final AuditionRecommendationService recommendations;

    public AuditionRecommendationController(AuditionRecommendationService recommendations) {
        this.recommendations = recommendations;
    }

    @GetMapping("/recommendations")
    public AuditionRecommendationResponse recommendations(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer limit) {
        return recommendations.recommend(country, limit);
    }

    @GetMapping("/closing-soon")
    public List<AuditionResponse> closingSoon(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer limit) {
        return recommendations.closingSoon(country, limit);
    }
}
