package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * MULTI_ROUND 지원 시 1차 제출 행 자동 생성 등 — SINGLE 은 비워 둠.
 */
@Service
public class ApplicationRoundSubmissionService {

    private final ApplicationRoundSubmissionRepository submissionRepository;
    private final AuditionRoundRepository roundRepository;
    private final ApplicationRepository applicationRepository;

    public ApplicationRoundSubmissionService(
            ApplicationRoundSubmissionRepository submissionRepository,
            AuditionRoundRepository roundRepository,
            ApplicationRepository applicationRepository) {
        this.submissionRepository = submissionRepository;
        this.roundRepository = roundRepository;
        this.applicationRepository = applicationRepository;
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
}
