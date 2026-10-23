package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.application.publicview.PublicAgencyService;
import com.audition.platform.application.publicview.PublicAgencyService.PublicAgencyCard;
import com.audition.platform.application.publicview.PublicAgencyService.PublicAgencyDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agencies/public")
public class PublicAgencyController {

    private final PublicAgencyService publicAgencyService;

    public PublicAgencyController(PublicAgencyService publicAgencyService) {
        this.publicAgencyService = publicAgencyService;
    }

    @GetMapping
    public ApiEnvelope<List<PublicAgencyCard>> list() {
        return ApiEnvelope.ok(publicAgencyService.list());
    }

    @GetMapping("/{agencyId}")
    public ApiEnvelope<PublicAgencyDetail> get(@PathVariable UUID agencyId) {
        return ApiEnvelope.ok(publicAgencyService.get(agencyId));
    }
}
