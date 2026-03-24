package com.audition.platform.api;

import com.audition.platform.api.dto.admin.AdminAuditionRoundResponse;
import com.audition.platform.api.dto.admin.AdminCreateAuditionRoundRequest;
import com.audition.platform.api.dto.admin.AdminPatchAuditionRoundRequest;
import com.audition.platform.api.dto.admin.AdminRoundApplicationRowDto;
import com.audition.platform.application.round.AuditionManageAccess;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/auditions/{auditionId}/rounds")
public class AdminAuditionRoundController {

    private final AuditionManageAccess manageAccess;
    private final AuditionRoundService roundService;
    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public AdminAuditionRoundController(
            AuditionManageAccess manageAccess,
            AuditionRoundService roundService,
            ApplicationRoundSubmissionRepository submissionRepository,
            ApplicationRepository applicationRepository,
            UserRepository userRepository) {
        this.manageAccess = manageAccess;
        this.roundService = roundService;
        this.submissionRepository = submissionRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<AdminAuditionRoundResponse> list(@PathVariable UUID auditionId) {
        manageAccess.requireManagedAudition(auditionId);
        return roundService.listRounds(auditionId).stream()
                .map(r -> toResponse(r))
                .collect(Collectors.toList());
    }

    @PostMapping
    public AdminAuditionRoundResponse create(
            @PathVariable UUID auditionId, @Valid @RequestBody AdminCreateAuditionRoundRequest body) {
        manageAccess.requireManagedAudition(auditionId);
        AuditionRound r = roundService.createRound(
                auditionId,
                body.getRoundName(),
                body.getReviewMethod(),
                body.getRequiredSubmissionType(),
                parseInstantOrNull(body.getStartAt(), "startAt"),
                parseInstantOrNull(body.getEndAt(), "endAt"));
        return toResponse(r);
    }

    @PatchMapping("/{roundId}")
    public AdminAuditionRoundResponse patch(
            @PathVariable UUID auditionId,
            @PathVariable UUID roundId,
            @Valid @RequestBody AdminPatchAuditionRoundRequest body) {
        manageAccess.requireManagedAudition(auditionId);
        AuditionRound r = roundService.updateRound(
                auditionId,
                roundId,
                body.getRoundName(),
                parseInstantOrNull(body.getStartAt(), "startAt"),
                parseInstantOrNull(body.getEndAt(), "endAt"),
                body.getReviewMethod(),
                body.getRequiredSubmissionType());
        return toResponse(r);
    }

    @PostMapping("/{roundId}/open")
    public AdminAuditionRoundResponse open(@PathVariable UUID auditionId, @PathVariable UUID roundId) {
        manageAccess.requireManagedAudition(auditionId);
        roundService.requireRoundBelongsToAudition(auditionId, roundId);
        return toResponse(roundService.openRound(auditionId, roundId));
    }

    @PostMapping("/{roundId}/close")
    public AdminAuditionRoundResponse close(@PathVariable UUID auditionId, @PathVariable UUID roundId) {
        manageAccess.requireManagedAudition(auditionId);
        roundService.requireRoundBelongsToAudition(auditionId, roundId);
        return toResponse(roundService.closeRound(auditionId, roundId));
    }

    @GetMapping("/{roundId}/applications")
    public List<AdminRoundApplicationRowDto> applications(
            @PathVariable UUID auditionId, @PathVariable UUID roundId) {
        manageAccess.requireManagedAudition(auditionId);
        AuditionRound round = roundService.requireRoundBelongsToAudition(auditionId, roundId);
        List<ApplicationRoundSubmission> subs = submissionRepository.findByRoundId(round.getId());
        return subs.stream().map(this::toAppRow).collect(Collectors.toList());
    }

    private AdminRoundApplicationRowDto toAppRow(ApplicationRoundSubmission sub) {
        Application app = applicationRepository.findById(sub.getApplicationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        User u = userRepository.findById(app.getApplicantId()).orElse(null);
        AdminRoundApplicationRowDto dto = new AdminRoundApplicationRowDto();
        dto.setApplicationId(app.getId());
        dto.setRoundSubmissionId(sub.getId());
        dto.setApplicantEmail(u != null ? u.getEmail() : null);
        dto.setApplicantDisplayName(u != null ? u.getDisplayName() : null);
        dto.setApplicationCurrentRoundNumber(app.getCurrentRoundNumber());
        dto.setFinalStatus(app.getFinalStatus());
        dto.setLatestResultStatus(app.getLatestResultStatus());
        dto.setSubmissionStatus(sub.getSubmissionStatus());
        dto.setSubmittedAt(sub.getSubmittedAt());
        return dto;
    }

    private AdminAuditionRoundResponse toResponse(AuditionRound r) {
        AdminAuditionRoundResponse dto = new AdminAuditionRoundResponse();
        dto.setId(r.getId());
        dto.setRoundNumber(r.getRoundNumber());
        dto.setRoundName(r.getRoundName());
        dto.setReviewMethod(r.getReviewMethod());
        dto.setRequiredSubmissionType(r.getRequiredSubmissionType());
        dto.setStartAt(r.getStartAt());
        dto.setEndAt(r.getEndAt());
        dto.setActive(r.isActive());
        dto.setSubmissionCount(submissionRepository.countByRoundId(r.getId()));
        dto.setPassedCount(submissionRepository.countByRoundIdAndSubmissionStatus(r.getId(), "PASSED"));
        return dto;
    }

    private static Instant parseInstantOrNull(String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, field + " must be ISO-8601 instant");
        }
    }
}
