package com.audition.platform.application.applications;

import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.CreateApplicationRequest;
import com.audition.platform.application.ApplicationService;
import com.audition.platform.application.applications.ApplicationValidationService.NormalizedSnsLink;
import com.audition.platform.application.applications.ApplicationValidationService.ValidatedBirthDate;
import com.audition.platform.application.audition.AuditionSeriesEligibilityService;
import com.audition.platform.application.audition.AuditionSeriesPresentation;
import com.audition.platform.application.credit.CreditPolicyKey;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.round.ApplicationRoundSubmissionService;
import com.audition.platform.application.round.AuditionProcessModes;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLink;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 지원자 관점의 지원서 제출/조회 유스케이스 경계.
 *
 * <p>지원서 제출 흐름은 이 서비스가 담당한다. 기존 조회/레거시 경로는 아직
 * {@link ApplicationService}에 위임해 점진 리팩토링 안정성을 유지한다.</p>
 */
@Service
public class ApplicationSubmitService {

    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final CreditService creditService;
    private final ApplicationRoundSubmissionService applicationRoundSubmissionService;
    private final AuditionSeriesEligibilityService auditionSeriesEligibilityService;
    private final ApplicationValidationService applicationValidationService;

    public ApplicationSubmitService(
            ApplicationService applicationService,
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            CreditService creditService,
            ApplicationRoundSubmissionService applicationRoundSubmissionService,
            AuditionSeriesEligibilityService auditionSeriesEligibilityService,
            ApplicationValidationService applicationValidationService) {
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.creditService = creditService;
        this.applicationRoundSubmissionService = applicationRoundSubmissionService;
        this.auditionSeriesEligibilityService = auditionSeriesEligibilityService;
        this.applicationValidationService = applicationValidationService;
    }

    public ApplicationResponse apply(UUID auditionId) {
        return applicationService.apply(auditionId);
    }

    @Transactional
    public ApplicationResponse submitApplication(CreateApplicationRequest body) {
        UUID applicantId = SecurityUtils.getCurrentUserId();
        if (applicantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자만 지원할 수 있습니다.");
        }

        UUID auditionId = body.getAuditionId();
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 중인 오디션이 아닙니다.");
        }
        if (!auditionSeriesEligibilityService.canApply(applicantId, audition)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED);
        }
        if (applicationRepository.existsByAuditionIdAndApplicantId(auditionId, applicantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 지원 완료입니다.");
        }

        String applicantName = body.getName() != null ? body.getName().trim() : "";
        if (applicantName.isEmpty()) {
            applicantName = null;
        }

        ValidatedBirthDate birth = applicationValidationService.validateBirthDate(body.getBirthDate(), body.getAge());
        String nationality = applicationValidationService.normalizeNationality(body.getNationality());
        String videoUrl = applicationValidationService.validateAuditionVideoUrl(body.getVideoUrl());
        String introText = body.getIntroText() != null ? body.getIntroText().trim() : "";
        if (introText.isEmpty()) {
            introText = null;
        }
        List<NormalizedSnsLink> snsToSave = applicationValidationService.normalizeSnsPayload(body.snsLinksOrEmpty());

        creditService.useCredits(applicantId, CreditPolicyKey.AUDITION_APPLY, auditionId.toString());
        User applicant = userRepository.findById(applicantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자를 찾을 수 없습니다."));

        Application app = new Application();
        app.setAuditionId(auditionId);
        app.setApplicantId(applicantId);
        app.setStatus("SUBMITTED");
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            int initialRound = 1;
            if (audition.getCurrentRoundNumber() != null && audition.getCurrentRoundNumber() > 0) {
                initialRound = audition.getCurrentRoundNumber();
            }
            app.setCurrentRoundNumber(initialRound);
        }
        app.setApplicantName(applicantName);
        app.setBirthDate(birth.birthDate());
        app.setAge(birth.age());
        app.setNationality(nationality);
        app.setVideoUrl(videoUrl);
        app.setIntroText(introText);
        app.setUpdatedAt(Instant.now());

        try {
            app = applicationRepository.save(app);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 지원 완료입니다.");
        }

        ApplicationVideo video = new ApplicationVideo();
        video.setApplicationId(app.getId());
        video.setVideoUrl(videoUrl);
        video.setUpdatedAt(Instant.now());
        applicationVideoRepository.save(video);

        for (NormalizedSnsLink row : snsToSave) {
            ApplicationSnsLink link = new ApplicationSnsLink();
            link.setApplicationId(app.getId());
            link.setPlatform(row.platform());
            link.setUrl(row.url());
            applicationSnsLinkRepository.save(link);
        }

        applicationRoundSubmissionService.onApplicationCreated(app, audition);
        long cnt = applicationRepository.countByAuditionId(auditionId);
        audition.setApplicantsCount((int) cnt);
        auditionRepository.save(audition);
        return toResponse(app, applicant);
    }

    public List<ApplicationResponse> listMyApplications() {
        return applicationService.listMyApplications();
    }

    public ApplicationResponse getApplicationForApplicantOrOwner(UUID id) {
        return applicationService.getApplicationForApplicantOrOwner(id);
    }

    private static ApplicationResponse toResponse(Application app, User applicant) {
        ApplicationResponse r = new ApplicationResponse();
        r.setId(app.getId());
        r.setAuditionId(app.getAuditionId());
        r.setApplicantId(app.getApplicantId());
        r.setApplicantEmail(applicant != null ? applicant.getEmail() : null);
        r.setStatus(app.getStatus());
        r.setMessage(app.getMessage());
        r.setUpdatedAt(app.getUpdatedAt());
        r.setCreatedAt(app.getCreatedAt());
        r.setName(app.getApplicantName());
        r.setBirthDate(app.getBirthDate() != null ? app.getBirthDate().toString() : null);
        r.setAge(app.getAge());
        r.setNationality(app.getNationality());
        r.setIntroText(app.getIntroText());
        r.setVideoUrl(app.getVideoUrl());
        return r;
    }
}
