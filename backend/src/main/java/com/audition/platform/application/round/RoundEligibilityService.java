package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 특정 라운드 제출 가능 여부 — 이후 사용자 API·프론트 버튼과 공통 사용.
 */
@Service
public class RoundEligibilityService {

    private final ApplicationRoundSubmissionRepository submissionRepository;

    public RoundEligibilityService(ApplicationRoundSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    public record Eligibility(boolean eligible, String reasonCode, boolean canSubmit) {
    }

    @Transactional(readOnly = true)
    public Eligibility evaluate(Application application, Audition audition, AuditionRound targetRound) {
        if (!AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
            return new Eligibility(false, "NOT_MULTI_ROUND", false);
        }
        if (!"OPEN".equals(audition.getStatus())) {
            return new Eligibility(false, "AUDITION_NOT_OPEN", false);
        }
        if (!targetRound.isActive()) {
            return new Eligibility(false, "ROUND_NOT_ACTIVE", false);
        }
        if (application.getFinalStatus() != null
                && (application.getFinalStatus().equals("ELIMINATED")
                        || application.getFinalStatus().equals("FINAL_PASSED")
                        || application.getFinalStatus().equals("FINAL_FAILED"))) {
            return new Eligibility(false, "APPLICATION_CLOSED", false);
        }
        int n = targetRound.getRoundNumber();
        if (application.getCurrentRoundNumber() != n) {
            return new Eligibility(false, "WRONG_CURRENT_ROUND", false);
        }
        if (n > 1 && !previousRoundPassed(application, n)) {
            return new Eligibility(false, "PREVIOUS_ROUND_NOT_PASSED", false);
        }
        Optional<ApplicationRoundSubmission> subOpt =
                submissionRepository.findByApplicationIdAndRoundId(application.getId(), targetRound.getId());
        if (subOpt.isEmpty()) {
            return new Eligibility(false, "NO_SUBMISSION_ROW", false);
        }
        ApplicationRoundSubmission sub = subOpt.get();
        String st = sub.getSubmissionStatus();
        if ("FAILED".equals(st) || "SKIPPED".equals(st)) {
            return new Eligibility(false, "SUBMISSION_CLOSED", false);
        }
        if ("PASSED".equals(st)) {
            return new Eligibility(false, "ROUND_ALREADY_DECIDED", false);
        }
        boolean canSubmit = "NOT_SUBMITTED".equals(st);
        return new Eligibility(true, "OK", canSubmit);
    }

    private boolean previousRoundPassed(Application application, int targetRoundNumber) {
        return submissionRepository.findByApplicationIdOrderByRoundNumberAsc(application.getId()).stream()
                .filter(s -> s.getRoundNumber() == targetRoundNumber - 1)
                .findFirst()
                .map(s -> "PASSED".equals(s.getSubmissionStatus()))
                .orElse(false);
    }
}
