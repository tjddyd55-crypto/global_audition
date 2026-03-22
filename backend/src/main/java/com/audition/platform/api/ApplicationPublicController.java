package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.ApplicationPublicVideoDto;
import com.audition.platform.api.dto.ApplicationRecommendItemDto;
import com.audition.platform.application.publicmedia.ApplicationPublicVideoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApplicationPublicController {

    private final ApplicationPublicVideoService applicationPublicVideoService;

    public ApplicationPublicController(ApplicationPublicVideoService applicationPublicVideoService) {
        this.applicationPublicVideoService = applicationPublicVideoService;
    }

    @GetMapping("/applications/{id}/public")
    public ApiEnvelope<ApplicationPublicVideoDto> getPublicDetail(@PathVariable("id") UUID id) {
        return ApiEnvelope.ok(applicationPublicVideoService.getPublicDetail(id));
    }

    /** GET /api/applications?exclude={uuid} — 추천/허브 목록 */
    @GetMapping("/applications")
    public ApiEnvelope<List<ApplicationRecommendItemDto>> listApplications(
            @RequestParam(name = "exclude", required = false) UUID exclude) {
        return ApiEnvelope.ok(applicationPublicVideoService.listRecommendations(exclude));
    }
}
