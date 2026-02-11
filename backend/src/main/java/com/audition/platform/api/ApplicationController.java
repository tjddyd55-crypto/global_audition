package com.audition.platform.api;

import com.audition.platform.api.dto.ApplicationResponse;
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

    @GetMapping("/applications/me")
    public List<ApplicationResponse> listMyApplications() {
        return applicationService.listMyApplications();
    }

    @GetMapping("/auditions/{auditionId}/applications")
    public List<ApplicationResponse> listApplications(@PathVariable UUID auditionId) {
        return applicationService.listByAudition(auditionId);
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateApplicationStatusRequest request) {
        return applicationService.updateStatus(id, request.getStatus());
    }

    @PostMapping("/applications/{id}/accept")
    public ApplicationResponse accept(@PathVariable UUID id) {
        return applicationService.accept(id);
    }

    @PostMapping("/applications/{id}/reject")
    public ApplicationResponse reject(@PathVariable UUID id) {
        return applicationService.reject(id);
    }
}
