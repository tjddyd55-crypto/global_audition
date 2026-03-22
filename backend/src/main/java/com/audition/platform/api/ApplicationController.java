package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationDecisionRequest;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.api.dto.PatchApplicationStatusRequest;
import com.audition.platform.application.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ApiEnvelope<AgencyApplicantsListDto> listApplications(@PathVariable UUID auditionId) {
        return ApiEnvelope.ok(applicationService.listAgencyApplicants(auditionId));
    }

    @GetMapping("/auditions/{auditionId}/applications/manage")
    public ApiEnvelope<ManageApplicationsPageDataDto> listApplicationsManage(
            @PathVariable UUID auditionId,
            @RequestParam(name = "category", required = false) String category) {
        return ApiEnvelope.ok(applicationService.listManageApplications(auditionId, category));
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
    public ApiEnvelope<ApplicationStatusPatchDataDto> patchApplicationStatus(
            @PathVariable UUID id,
            @Valid @RequestBody PatchApplicationStatusRequest request) {
        return ApiEnvelope.ok(applicationService.patchApplicationStatus(id, request.getStatus()));
    }

    /** 공개 투표 등에서 대표 영상 조회수 +1 (인증 불필요, MVP) */
    @PostMapping("/applications/{id}/view")
    public ApiEnvelope<Boolean> incrementApplicationView(@PathVariable UUID id) {
        applicationService.incrementRepresentativeVideoView(id);
        return ApiEnvelope.ok(Boolean.TRUE);
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
