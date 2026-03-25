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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 지원자입니다.");
        }
        if ("SKIPPED".equals(fromStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "건너뛴 라운드는 심사할 수 없습니다.");
        }
        if (!isPendingForReview(fromStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "심사 전이할 수 없는 제출 상태입니다: " + fromStatus);
        }
        if (!"PASSED".equals(toStatus) && !"FAILED".equals(toStatus) && !"UNDER_REVIEW".equals(toStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 심사 결과입니다.");
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "다단계 오디션만 라운드 심사를 사용할 수 있습니다.");
        }
        AuditionRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "라운드를 찾을 수 없습니다."));
        if (!round.getAuditionId().equals(audition.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오디션·라운드·지원이 일치하지 않습니다.");
        }
        if (app.getCurrentRoundNumber() != round.getRoundNumber()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 지원자의 현재 라운드와 심사 대상 라운드가 다릅니다.");
        }
        ApplicationRoundSubmission sub = submissionRepository
                .findByApplicationIdAndRoundId(applicationId, roundId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 라운드 제출이 없습니다."));

        String prev = sub.getSubmissionStatus();
        if ("PASSED".equals(prev) || "FAILED".equals(prev)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 지원자입니다.");
        }
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
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.CONFLICT, "다음 라운드가 아직 생성되지 않았습니다. 라운드를 추가한 뒤 합격 처리하세요."));
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
