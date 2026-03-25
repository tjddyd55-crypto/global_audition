package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeRoundEligibilityDto;
import com.audition.platform.api.dto.me.MeRoundSubmitRequest;
import com.audition.platform.api.dto.me.MeRoundSubmitResponseDto;
import com.audition.platform.application.round.ApplicationRoundSubmissionService;
import com.audition.platform.application.round.RoundEligibilityService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class MeApplicationRoundService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final AuditionRoundRepository roundRepository;
    private final RoundEligibilityService roundEligibilityService;
    private final ApplicationRoundSubmissionService applicationRoundSubmissionService;

    public MeApplicationRoundService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            AuditionRoundRepository roundRepository,
            RoundEligibilityService roundEligibilityService,
            ApplicationRoundSubmissionService applicationRoundSubmissionService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.roundRepository = roundRepository;
        this.roundEligibilityService = roundEligibilityService;
        this.applicationRoundSubmissionService = applicationRoundSubmissionService;
    }

    private UUID requireApplicant() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자만 이용할 수 있습니다.");
        }
        return userId;
    }

    @Transactional(readOnly = true)
    public MeRoundEligibilityDto getEligibility(UUID applicationId, UUID roundId) {
        UUID applicantId = requireApplicant();
        Application app = requireOwnedApplication(applicationId, applicantId);
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "라운드를 찾을 수 없습니다."));
        RoundEligibilityService.EligibilityDetail d = roundEligibilityService.evaluate(app, audition, round);
        MeRoundEligibilityDto dto = new MeRoundEligibilityDto();
        dto.setSubmissionStatus(d.submissionStatus());
        dto.setCanSubmit(d.effectiveCanSubmit());
        dto.setReason(d.effectiveCanSubmit() ? null : d.reasonCode());
        return dto;
    }

    @Transactional
    public MeRoundSubmitResponseDto submit(UUID applicationId, UUID roundId, MeRoundSubmitRequest req) {
        UUID applicantId = requireApplicant();
        ApplicationRoundSubmission sub =
                applicationRoundSubmissionService.submitForApplicant(applicationId, applicantId, roundId, req);
        MeRoundSubmitResponseDto dto = new MeRoundSubmitResponseDto();
        dto.setSubmissionStatus(sub.getSubmissionStatus());
        dto.setRoundNumber(sub.getRoundNumber());
        return dto;
    }

    private Application requireOwnedApplication(UUID applicationId, UUID applicantId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 지원서를 찾을 수 없습니다."));
        if (!app.getApplicantId().equals(applicantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 지원서를 찾을 수 없습니다.");
        }
        return app;
    }
}
