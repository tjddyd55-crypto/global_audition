package com.audition.platform.application.round;

import com.audition.platform.api.dto.admin.AdminRoundReviewResponse;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.audition.AuditionRoundResultLog;
import com.audition.platform.domain.audition.AuditionRoundResultLogRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RoundReviewService {

    /**
     * 제출 상태 기준 심사 전이 규칙.
     * <ul>
     *   <li>NOT_SUBMITTED / SUBMITTED / UNDER_REVIEW → PASSED, FAILED, UNDER_REVIEW(보류) 허용</li>
     *   <li>PASSED / FAILED / SKIPPED → 재심사 불가</li>
     * </ul>
     */
    public static void validateStatusTransition(String fromStatus, String toStatus) {
        if ("PASSED".equals(fromStatus) || "FAILED".equals(fromStatus)) {
            throw ReasonCode.REVIEW_SUBMISSION_ALREADY_FINAL.toException();
        }
        if ("SKIPPED".equals(fromStatus)) {
            throw ReasonCode.REVIEW_ROUND_SKIPPED.toException();
        }
        if (!isPendingForReview(fromStatus)) {
            throw ReasonCode.REVIEW_INVALID_FROM_STATUS.toException();
        }
        if (!"PASSED".equals(toStatus) && !"FAILED".equals(toStatus) && !"UNDER_REVIEW".equals(toStatus)) {
            throw ReasonCode.REVIEW_INVALID_RESULT_STATUS.toException();
        }
    }

    private static boolean isPendingForReview(String s) {
        return "NOT_SUBMITTED".equals(s) || "SUBMITTED".equals(s) || "UNDER_REVIEW".equals(s);
    }

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final AuditionRoundRepository roundRepository;
    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final AuditionRoundResultLogRepository resultLogRepository;
    private final ApplicationRoundSubmissionService submissionService;
    private final RoundNotificationService notificationService;

    public RoundReviewService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            AuditionRoundRepository roundRepository,
            ApplicationRoundSubmissionRepository submissionRepository,
            AuditionRoundResultLogRepository resultLogRepository,
            ApplicationRoundSubmissionService submissionService,
            RoundNotificationService notificationService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.roundRepository = roundRepository;
        this.submissionRepository = submissionRepository;
        this.resultLogRepository = resultLogRepository;
        this.submissionService = submissionService;
        this.notificationService = notificationService;
    }

    /**
     * 저장과 알림은 이 트랜잭션 안에서 끝난다. 응답은 커밋 뒤 세션 밖에서 직렬화되므로
     * 지연 로딩 연관이 있는 엔티티 대신, 이미 조회한 컬럼만 복사한 DTO 를 돌려준다.
     * 같은 합격/불합격이 이미 반영돼 있으면 상태와 알림을 다시 쓰지 않는다.
     */
    @Transactional
    public AdminRoundReviewResponse pass(UUID applicationId, UUID roundId) {
        return transition(applicationId, roundId, "PASSED", null);
    }

    @Transactional
    public AdminRoundReviewResponse fail(UUID applicationId, UUID roundId, String reason) {
        return transition(applicationId, roundId, "FAILED", reason);
    }

    @Transactional
    public AdminRoundReviewResponse hold(UUID applicationId, UUID roundId, String reason) {
        return transition(applicationId, roundId, "UNDER_REVIEW", reason);
    }

    private AdminRoundReviewResponse transition(
            UUID applicationId, UUID roundId, String nextSubmissionStatus, String reason) {
        ReviewTarget target = loadTarget(applicationId, roundId);
        ApplicationRoundSubmission submission = target.submission();
        if (isSameTerminalDecision(submission.getSubmissionStatus(), nextSubmissionStatus)) {
            return toResponse(target.application(), submission);
        }
        if (target.application().getCurrentRoundNumber() != target.round().getRoundNumber()) {
            throw ReasonCode.WRONG_CURRENT_ROUND.toException();
        }
        return applyDecision(target, nextSubmissionStatus, reason);
    }

    private ReviewTarget loadTarget(UUID applicationId, UUID roundId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ReasonCode.APPLICATION_NOT_FOUND.toException());
        Audition audition = auditionRepository.findById(application.getAuditionId())
                .orElseThrow(() -> ReasonCode.AUDITION_NOT_FOUND.toException());
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            throw ReasonCode.NOT_MULTI_ROUND.toException();
        }
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> ReasonCode.ROUND_NOT_FOUND.toException());
        if (!round.getAuditionId().equals(audition.getId())) {
            throw ReasonCode.AUDITION_ROUND_MISMATCH.toException();
        }
        ApplicationRoundSubmission submission = submissionRepository
                .findByApplicationIdAndRoundId(applicationId, roundId)
                .orElseThrow(() -> ReasonCode.SUBMISSION_NOT_FOUND.toException());
        return new ReviewTarget(application, audition, round, submission);
    }

    private AdminRoundReviewResponse applyDecision(ReviewTarget target, String nextStatus, String reason) {
        ApplicationRoundSubmission submission = target.submission();
        String previous = submission.getSubmissionStatus();
        validateStatusTransition(previous, nextStatus);
        UUID actor = SecurityUtils.getCurrentUserId();
        submission.setSubmissionStatus(nextStatus);
        submission.setReviewedAt(Instant.now());
        submission.setReviewerUserId(actor);
        if (reason != null && !reason.isBlank()) {
            submission.setReviewerNote(reason.trim());
        }
        submission = submissionRepository.save(submission);
        appendLog(target.application().getId(), target.round().getId(), previous, nextStatus, actor, reason);
        if ("PASSED".equals(nextStatus)) {
            applyPassSideEffects(target.application(), target.audition(), target.round(), submission);
            notificationService.logPassNotice(target.application(), target.round());
        } else if ("FAILED".equals(nextStatus)) {
            applyFailSideEffects(target.application(), target.round(), submission);
            notificationService.logFailNotice(target.application(), target.round());
        }
        return toResponse(target.application(), submission);
    }

    /** 기본 컬럼만 복사한다. application/round/reviewer 연관은 읽지 않는다. */
    private static AdminRoundReviewResponse toResponse(Application application, ApplicationRoundSubmission submission) {
        return new AdminRoundReviewResponse(
                submission.getId(),
                application.getId(),
                submission.getRoundId(),
                submission.getRoundNumber(),
                submission.getSubmissionStatus(),
                submission.getReviewerNote(),
                application.getStatus(),
                application.getCurrentRoundNumber(),
                application.getFinalStatus(),
                application.getLatestResultStatus());
    }

    /** 이미 같은 합격/불합격이면 재시도다. 반대 결과나 보류는 기존 전이 규칙을 탄다. */
    private static boolean isSameTerminalDecision(String current, String requested) {
        return ("PASSED".equals(requested) || "FAILED".equals(requested)) && requested.equals(current);
    }

    private record ReviewTarget(
            Application application, Audition audition, AuditionRound round, ApplicationRoundSubmission submission) {
    }

    private void applyPassSideEffects(
            Application app, Audition audition, AuditionRound round, ApplicationRoundSubmission passedSubmission) {
        app.setLatestResultStatus("PASSED");
        app.setLatestRoundSubmissionId(passedSubmission.getId());
        boolean last = isLastRoundInAudition(audition.getId(), round);
        if (last) {
            app.setFinalStatus("FINAL_PASSED");
            app.setStatus("ACCEPTED");
        } else {
            app.setFinalStatus("IN_PROGRESS");
            app.setStatus("SUBMITTED");
            int nextNum = round.getRoundNumber() + 1;
            app.setCurrentRoundNumber(nextNum);
            AuditionRound nextRound = roundRepository
                    .findByAuditionIdAndRoundNumber(audition.getId(), nextNum)
                    .orElseThrow(() -> ReasonCode.NEXT_ROUND_NOT_CREATED.toException());
            ApplicationRoundSubmission nextSub = submissionService.ensureSubmissionForRound(app, nextRound);
            app.setLatestRoundSubmissionId(nextSub.getId());
        }
        app.setUpdatedAt(Instant.now());
        applicationRepository.save(app);
    }

    private void applyFailSideEffects(Application app, AuditionRound round, ApplicationRoundSubmission sub) {
        app.setLatestResultStatus("FAILED");
        app.setLatestRoundSubmissionId(sub.getId());
        boolean last = isLastRoundInAudition(round.getAuditionId(), round);
        if (last) {
            app.setFinalStatus("FINAL_FAILED");
        } else {
            app.setFinalStatus("ELIMINATED");
        }
        app.setStatus("REJECTED");
        app.setUpdatedAt(Instant.now());
        applicationRepository.save(app);
    }

    private boolean isLastRoundInAudition(UUID auditionId, AuditionRound round) {
        List<AuditionRound> rs = roundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId);
        if (rs.isEmpty()) {
            return true;
        }
        return rs.get(rs.size() - 1).getRoundNumber() == round.getRoundNumber();
    }

    private void appendLog(
            UUID applicationId,
            UUID roundId,
            String previousStatus,
            String nextStatus,
            UUID changedByUserId,
            String reason) {
        AuditionRoundResultLog log = new AuditionRoundResultLog();
        log.setApplicationId(applicationId);
        log.setRoundId(roundId);
        log.setPreviousStatus(previousStatus);
        log.setNextStatus(nextStatus);
        log.setChangedByUserId(changedByUserId);
        log.setReason(reason);
        resultLogRepository.save(log);
    }
}
