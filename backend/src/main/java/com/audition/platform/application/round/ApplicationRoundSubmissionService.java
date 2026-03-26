package com.audition.platform.application.round;

import com.audition.platform.api.dto.me.MeRoundSubmitRequest;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.util.YoutubeUrls;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * MULTI_ROUND 지원 시 1차 제출 행 자동 생성 및 라운드 제출 처리 — SINGLE 은 이 서비스의 submit 경로 미사용.
 */
@Service
public class ApplicationRoundSubmissionService {

    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final AuditionRoundRepository roundRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final RoundEligibilityService roundEligibilityService;

    public ApplicationRoundSubmissionService(
            ApplicationRoundSubmissionRepository submissionRepository,
            AuditionRoundRepository roundRepository,
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            RoundEligibilityService roundEligibilityService) {
        this.submissionRepository = submissionRepository;
        this.roundRepository = roundRepository;
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.roundEligibilityService = roundEligibilityService;
    }

    @Transactional
    public void onApplicationCreated(Application app, Audition audition) {
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            return;
        }
        AuditionRound round1 = roundRepository
                .findByAuditionIdAndRoundNumber(app.getAuditionId(), 1)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "다단계 오디션에 1차 라운드가 없습니다. 관리자에게 문의하세요."));
        if (submissionRepository.findByApplicationIdAndRoundId(app.getId(), round1.getId()).isPresent()) {
            return;
        }
        ApplicationRoundSubmission s = new ApplicationRoundSubmission();
        s.setApplicationId(app.getId());
        s.setAuditionId(app.getAuditionId());
        s.setRoundId(round1.getId());
        s.setRoundNumber(1);
        s.setSubmissionStatus("NOT_SUBMITTED");
        s.setVoteCount(0);
        s = submissionRepository.save(s);
        app.setCurrentRoundNumber(1);
        app.setLatestRoundSubmissionId(s.getId());
        applicationRepository.save(app);
    }

    @Transactional
    public ApplicationRoundSubmission ensureSubmissionForRound(Application app, AuditionRound round) {
        return submissionRepository
                .findByApplicationIdAndRoundId(app.getId(), round.getId())
                .orElseGet(() -> {
                    ApplicationRoundSubmission s = new ApplicationRoundSubmission();
                    s.setApplicationId(app.getId());
                    s.setAuditionId(app.getAuditionId());
                    s.setRoundId(round.getId());
                    s.setRoundNumber(round.getRoundNumber());
                    s.setSubmissionStatus("NOT_SUBMITTED");
                    s.setVoteCount(0);
                    return submissionRepository.save(s);
                });
    }

    /**
     * 지원자 본인의 라운드 제출 — 선행 {@link RoundEligibilityService#evaluate} 통과 필수.
     */
    @Transactional
    public ApplicationRoundSubmission submitForApplicant(
            UUID applicationId, UUID applicantId, UUID roundId, MeRoundSubmitRequest req) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ReasonCode.APPLICATION_NOT_FOUND.toException());
        if (!app.getApplicantId().equals(applicantId)) {
            throw ReasonCode.APPLICATION_NOT_FOUND.toException();
        }
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> ReasonCode.AUDITION_NOT_FOUND.toException());
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            throw ReasonCode.NOT_MULTI_ROUND.toException();
        }
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> ReasonCode.ROUND_NOT_FOUND.toException());
        if (!round.getAuditionId().equals(audition.getId())) {
            throw ReasonCode.AUDITION_ROUND_MISMATCH.toException();
        }
        assertRoundAcceptingSubmissions(round);

        RoundEligibilityService.EligibilityDetail eligibility =
                roundEligibilityService.evaluate(app, audition, round);
        if (!eligibility.effectiveCanSubmit()) {
            throw ReasonCode.submitEligibilityDenied(eligibility.reasonCode());
        }

        // 라운드 비활성·심사 시작은 eligibility 이후에도 바뀔 수 있으므로 DB 최신 값으로 재검증
        AuditionRound roundFresh = roundRepository.findById(roundId)
                .orElseThrow(() -> ReasonCode.ROUND_NOT_FOUND.toException());
        assertRoundAcceptingSubmissions(roundFresh);
        Optional<ApplicationRoundSubmission> subOpt =
                submissionRepository.findByApplicationIdAndRoundId(applicationId, roundId);
        if (subOpt.isEmpty()) {
            throw ReasonCode.SUBMISSION_NOT_FOUND.toException();
        }
        ApplicationRoundSubmission sub = subOpt.get();
        if ("UNDER_REVIEW".equals(sub.getSubmissionStatus())) {
            throw ReasonCode.UNDER_REVIEW_LOCKED.toException();
        }

        assertPayloadMatchesRound(roundFresh, req);
        applyRequestToSubmission(sub, req);
        sub.setSubmissionStatus("SUBMITTED");
        sub.setSubmittedAt(Instant.now());
        sub = submissionRepository.save(sub);

        app.setLatestRoundSubmissionId(sub.getId());
        app.setUpdatedAt(Instant.now());
        applicationRepository.save(app);
        return sub;
    }

    /** eligibility 의 ROUND_NOT_ACTIVE 와 동일 조건 — 컨트롤러가 아닌 서비스에서만 호출 */
    private static void assertRoundAcceptingSubmissions(AuditionRound round) {
        if (!round.isActive()) {
            throw ReasonCode.ROUND_NOT_ACTIVE.toException();
        }
    }

    private static void applyRequestToSubmission(ApplicationRoundSubmission sub, MeRoundSubmitRequest req) {
        if (req.getVideoUrl() != null) {
            sub.setVideoUrl(blankToNull(req.getVideoUrl().trim()));
        }
        if (req.getFileUrl() != null) {
            sub.setFileUrl(blankToNull(req.getFileUrl().trim()));
        }
        if (req.getTextAnswer() != null) {
            sub.setTextAnswer(blankToNull(req.getTextAnswer().trim()));
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isEmpty() ? null : s;
    }

    private void assertPayloadMatchesRound(AuditionRound round, MeRoundSubmitRequest req) {
        String v = req.getVideoUrl() != null ? req.getVideoUrl().trim() : "";
        String f = req.getFileUrl() != null ? req.getFileUrl().trim() : "";
        String t = req.getTextAnswer() != null ? req.getTextAnswer().trim() : "";
        String type = round.getRequiredSubmissionType();
        if ("VIDEO".equals(type)) {
            if (v.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "영상 링크(videoUrl)가 필요합니다.");
            }
            if (!YoutubeUrls.isBlankOrValidYoutube(v)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "영상 링크는 YouTube URL만 입력할 수 있습니다.");
            }
            return;
        }
        if ("FILE".equals(type)) {
            if (f.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "파일 URL(fileUrl)이 필요합니다.");
            }
            return;
        }
        if ("TEXT".equals(type)) {
            if (t.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "텍스트 답변이 필요합니다.");
            }
            return;
        }
        if ("MIXED".equals(type)) {
            if (v.isEmpty() && f.isEmpty() && t.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.UNPROCESSABLE_ENTITY, "제출물 중 최소 한 항목(videoUrl, fileUrl, textAnswer)이 필요합니다.");
            }
            if (!v.isEmpty() && !YoutubeUrls.isBlankOrValidYoutube(v)) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "영상 링크는 YouTube URL만 입력할 수 있습니다.");
            }
            return;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "알 수 없는 제출 유형입니다: " + type);
    }
}
