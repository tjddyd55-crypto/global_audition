package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * 특정 라운드 제출 가능 여부 — 사용자 API·프론트 버튼·제출 서비스 공통.
 */
@Service
public class RoundEligibilityService {

    private final ApplicationRoundSubmissionRepository submissionRepository;

    public RoundEligibilityService(ApplicationRoundSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    /**
     * @param reasonCode {@link ReasonCode#name()}, 성공 시 {@link ReasonCode#OK}
     * @param submissionStatus 현재 라운드 제출 상태 (행 없으면 null)
     */
    public record EligibilityDetail(
            boolean eligible,
            String reasonCode,
            boolean canSubmit,
            String submissionStatus) {

        public boolean effectiveCanSubmit() {
            return eligible && canSubmit;
        }

        public static EligibilityDetail ok(boolean canSubmit, String submissionStatus) {
            return new EligibilityDetail(true, ReasonCode.OK.name(), canSubmit, submissionStatus);
        }
    }

    @Transactional(readOnly = true)
    public EligibilityDetail evaluate(Application application, Audition audition, AuditionRound targetRound) {
        if (!targetRound.getAuditionId().equals(application.getAuditionId())) {
            return reject(ReasonCode.AUDITION_ROUND_MISMATCH, null);
        }
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            return reject(ReasonCode.NOT_MULTI_ROUND, null);
        }
        if (!"OPEN".equals(audition.getStatus())) {
            return reject(ReasonCode.AUDITION_NOT_OPEN, null);
        }
        if (!targetRound.isActive()) {
            return reject(ReasonCode.ROUND_NOT_ACTIVE, snapshotStatus(application.getId(), targetRound.getId()));
        }
        if (application.getFinalStatus() != null
                && (application.getFinalStatus().equals("ELIMINATED")
                        || application.getFinalStatus().equals("FINAL_PASSED")
                        || application.getFinalStatus().equals("FINAL_FAILED"))) {
            return reject(ReasonCode.APPLICATION_CLOSED, null);
        }
        int n = targetRound.getRoundNumber();
        if (application.getCurrentRoundNumber() != n) {
            return reject(ReasonCode.WRONG_CURRENT_ROUND, snapshotStatus(application.getId(), targetRound.getId()));
        }
        if (n > 1 && !previousRoundPassed(application, n)) {
            return reject(ReasonCode.PREVIOUS_ROUND_NOT_PASSED, snapshotStatus(application.getId(), targetRound.getId()));
        }
        Optional<ApplicationRoundSubmission> subOpt =
                submissionRepository.findByApplicationIdAndRoundId(application.getId(), targetRound.getId());
        if (subOpt.isEmpty()) {
            return reject(ReasonCode.NO_SUBMISSION_ROW, null);
        }
        ApplicationRoundSubmission sub = subOpt.get();
        String st = sub.getSubmissionStatus();
        if ("FAILED".equals(st) || "SKIPPED".equals(st)) {
            return reject(ReasonCode.SUBMISSION_CLOSED, st);
        }
        if ("PASSED".equals(st)) {
            return reject(ReasonCode.ROUND_ALREADY_DECIDED, st);
        }
        if ("UNDER_REVIEW".equals(st)) {
            return reject(ReasonCode.UNDER_REVIEW_LOCKED, st);
        }
        boolean canSubmit = "NOT_SUBMITTED".equals(st) || "SUBMITTED".equals(st);
        return EligibilityDetail.ok(canSubmit, st);
    }

    private String snapshotStatus(UUID applicationId, UUID roundId) {
        return submissionRepository
                .findByApplicationIdAndRoundId(applicationId, roundId)
                .map(ApplicationRoundSubmission::getSubmissionStatus)
                .orElse(null);
    }

    private static EligibilityDetail reject(ReasonCode code, String submissionStatus) {
        return new EligibilityDetail(false, code.name(), false, submissionStatus);
    }

    private boolean previousRoundPassed(Application application, int targetRoundNumber) {
        return submissionRepository.findByApplicationIdOrderByRoundNumberAsc(application.getId()).stream()
                .filter(s -> s.getRoundNumber() == targetRoundNumber - 1)
                .findFirst()
                .map(s -> "PASSED".equals(s.getSubmissionStatus()))
                .orElse(false);
    }
}
