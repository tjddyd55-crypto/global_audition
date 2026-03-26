package com.audition.platform.application.round;

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

    @Transactional
    public ApplicationRoundSubmission pass(UUID applicationId, UUID roundId) {
        return transition(applicationId, roundId, "PASSED", null);
    }

    @Transactional
    public ApplicationRoundSubmission fail(UUID applicationId, UUID roundId, String reason) {
        return transition(applicationId, roundId, "FAILED", reason);
    }

    @Transactional
    public ApplicationRoundSubmission hold(UUID applicationId, UUID roundId, String reason) {
        return transition(applicationId, roundId, "UNDER_REVIEW", reason);
    }

    private ApplicationRoundSubmission transition(
            UUID applicationId, UUID roundId, String nextSubmissionStatus, String reason) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ReasonCode.APPLICATION_NOT_FOUND.toException());
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
        if (app.getCurrentRoundNumber() != round.getRoundNumber()) {
            throw ReasonCode.WRONG_CURRENT_ROUND.toException();
        }
        ApplicationRoundSubmission sub = submissionRepository
                .findByApplicationIdAndRoundId(applicationId, roundId)
                .orElseThrow(() -> ReasonCode.SUBMISSION_NOT_FOUND.toException());

        String prev = sub.getSubmissionStatus();
        validateStatusTransition(prev, nextSubmissionStatus);
        UUID actor = SecurityUtils.getCurrentUserId();
        Instant now = Instant.now();

        sub.setSubmissionStatus(nextSubmissionStatus);
        sub.setReviewedAt(now);
        sub.setReviewerUserId(actor);
        if (reason != null && !reason.isBlank()) {
            sub.setReviewerNote(reason.trim());
        }
        sub = submissionRepository.save(sub);

        appendLog(applicationId, roundId, prev, nextSubmissionStatus, actor, reason);

        if ("PASSED".equals(nextSubmissionStatus)) {
            applyPassSideEffects(app, audition, round, sub);
            notificationService.logPassNotice(app, round);
        } else if ("FAILED".equals(nextSubmissionStatus)) {
            applyFailSideEffects(app, round, sub);
            notificationService.logFailNotice(app, round);
        }

        return sub;
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
