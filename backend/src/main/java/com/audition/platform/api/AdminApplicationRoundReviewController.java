package com.audition.platform.api;

import com.audition.platform.api.dto.admin.AdminRoundReviewRequest;
import com.audition.platform.application.round.AuditionManageAccess;
import com.audition.platform.application.round.RoundReviewService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/applications/{applicationId}/rounds/{roundId}")
public class AdminApplicationRoundReviewController {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final AuditionManageAccess manageAccess;
    private final RoundReviewService roundReviewService;

    public AdminApplicationRoundReviewController(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            AuditionManageAccess manageAccess,
            RoundReviewService roundReviewService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.manageAccess = manageAccess;
        this.roundReviewService = roundReviewService;
    }

    @PostMapping("/pass")
    public ApplicationRoundSubmission pass(
            @PathVariable UUID applicationId,
            @PathVariable UUID roundId,
            @Valid @RequestBody(required = false) AdminRoundReviewRequest body) {
        requireManage(applicationId);
        return roundReviewService.pass(applicationId, roundId);
    }

    @PostMapping("/fail")
    public ApplicationRoundSubmission fail(
            @PathVariable UUID applicationId,
            @PathVariable UUID roundId,
            @Valid @RequestBody(required = false) AdminRoundReviewRequest body) {
        requireManage(applicationId);
        String reason = body != null ? body.getReason() : null;
        return roundReviewService.fail(applicationId, roundId, reason);
    }

    @PostMapping("/hold")
    public ApplicationRoundSubmission hold(
            @PathVariable UUID applicationId,
            @PathVariable UUID roundId,
            @Valid @RequestBody(required = false) AdminRoundReviewRequest body) {
        requireManage(applicationId);
        String reason = body != null ? body.getReason() : null;
        return roundReviewService.hold(applicationId, roundId, reason);
    }

    private void requireManage(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        manageAccess.requireManagedAudition(audition.getId());
    }
}
