package com.audition.platform.api;

import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ApplicationDecisionRequest;
import com.audition.platform.api.dto.UpdateApplicationStatusRequest;
import com.audition.platform.application.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/auditions/{auditionId}/apply")
    public ApplicationResponse apply(@PathVariable UUID auditionId) {
        return applicationService.apply(auditionId);
    }

    @GetMapping("/applications/my")
    public List<ApplicationResponse> listMyApplications() {
        return applicationService.listMyApplications();
    }

    @GetMapping("/applications/me")
    public List<ApplicationResponse> listMyApplicationsLegacy() {
        return applicationService.listMyApplications();
    }

    @GetMapping("/auditions/{auditionId}/applications")
    public List<ApplicationResponse> listApplications(@PathVariable UUID auditionId) {
        return applicationService.listByAudition(auditionId);
    }

    @PostMapping("/applications/{id}/decision")
    public ApplicationResponse decide(@PathVariable UUID id, @Valid @RequestBody ApplicationDecisionRequest request) {
        return applicationService.decide(id, request.getStatus());
    }

    @PostMapping("/applications/{id}/mark-reviewed")
    public ApplicationResponse markReviewed(@PathVariable UUID id) {
        return applicationService.markReviewed(id);
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationResponse updateStatusLegacy(@PathVariable UUID id, @Valid @RequestBody UpdateApplicationStatusRequest request) {
        if ("REVIEWED".equals(request.getStatus())) {
            return applicationService.markReviewed(id);
        }
        return applicationService.decide(id, request.getStatus());
    }

    @PostMapping("/applications/{id}/accept")
    public ApplicationResponse acceptLegacy(@PathVariable UUID id) {
        return applicationService.decide(id, "ACCEPTED");
    }

    @PostMapping("/applications/{id}/reject")
    public ApplicationResponse rejectLegacy(@PathVariable UUID id) {
        return applicationService.decide(id, "REJECTED");
    }

    @GetMapping("/applications/{id}")
    public ApplicationResponse getById(@PathVariable UUID id) {
        return applicationService.getApplicationForApplicantOrOwner(id);
    }
}
