package com.audition.platform.application.round;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationRoundSubmission;
import com.audition.platform.domain.audition.ApplicationRoundSubmissionRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PrematureFinalizationTest {

    private ApplicationRoundSubmissionRepository submissionRepository;
    private AuditionRoundRepository roundRepository;
    private ApplicationRepository applicationRepository;
    private AuditionRepository auditionRepository;
    private ApplicationRoundSubmissionService service;

    @BeforeEach
    void setUp() {
        submissionRepository = mock(ApplicationRoundSubmissionRepository.class);
        roundRepository = mock(AuditionRoundRepository.class);
        applicationRepository = mock(ApplicationRepository.class);
        auditionRepository = mock(AuditionRepository.class);
        service = new ApplicationRoundSubmissionService(
                submissionRepository,
                roundRepository,
                applicationRepository,
                auditionRepository,
                mock(RoundEligibilityService.class));
    }

    @Test
    void plannedLastRoundPrefersVotingRoundCountOverBootstrapMax() {
        Audition audition = new Audition();
        audition.setMaxRoundNumber(1);
        audition.setVotingRoundCount(3);
        assertEquals(3, AuditionRoundService.plannedLastRoundNumber(audition));
        AuditionRound r1 = new AuditionRound();
        r1.setRoundNumber(1);
        AuditionRoundService rounds = new AuditionRoundService(
                roundRepository, submissionRepository, auditionRepository, service);
        assertFalse(rounds.isLastRound(audition, r1));
        AuditionRound r3 = new AuditionRound();
        r3.setRoundNumber(3);
        assertTrue(rounds.isLastRound(audition, r3));
    }

    @Test
    void reopenRestoresPrematureFinalPassWhenLaterRoundExists() {
        UUID auditionId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setProcessMode("MULTI_ROUND");
        audition.setMaxRoundNumber(3);
        audition.setVotingRoundCount(3);
        AuditionRound r2 = new AuditionRound();
        r2.setId(UUID.randomUUID());
        r2.setAuditionId(auditionId);
        r2.setRoundNumber(2);
        Application app = new Application();
        app.setId(UUID.randomUUID());
        app.setAuditionId(auditionId);
        app.setFinalStatus("FINAL_PASSED");
        app.setStatus("ACCEPTED");
        app.setCurrentRoundNumber(1);
        ApplicationRoundSubmission passed = new ApplicationRoundSubmission();
        passed.setId(UUID.randomUUID());
        passed.setRoundNumber(1);
        passed.setSubmissionStatus("PASSED");

        when(auditionRepository.findById(auditionId)).thenReturn(Optional.of(audition));
        when(applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId)).thenReturn(List.of(app));
        when(submissionRepository.findByApplicationIdOrderByRoundNumberAsc(app.getId())).thenReturn(List.of(passed));
        when(roundRepository.findByAuditionIdAndRoundNumber(auditionId, 2)).thenReturn(Optional.of(r2));
        when(submissionRepository.findByApplicationIdAndRoundId(app.getId(), r2.getId())).thenReturn(Optional.empty());
        when(submissionRepository.save(any())).thenAnswer(inv -> {
            ApplicationRoundSubmission s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            return s;
        });

        assertEquals(1, service.reopenPrematurelyFinalizedApplications(auditionId));
        assertEquals("IN_PROGRESS", app.getFinalStatus());
        assertEquals("SUBMITTED", app.getStatus());
        assertEquals(2, app.getCurrentRoundNumber());
    }

    @Test
    void reopenSkipsGenuinelyFinalPassOnPlannedLastRound() {
        UUID auditionId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setProcessMode("MULTI_ROUND");
        audition.setVotingRoundCount(2);
        audition.setMaxRoundNumber(2);
        Application app = new Application();
        app.setId(UUID.randomUUID());
        app.setFinalStatus("FINAL_PASSED");
        ApplicationRoundSubmission passed = new ApplicationRoundSubmission();
        passed.setRoundNumber(2);
        passed.setSubmissionStatus("PASSED");
        when(auditionRepository.findById(auditionId)).thenReturn(Optional.of(audition));
        when(applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId)).thenReturn(List.of(app));
        when(submissionRepository.findByApplicationIdOrderByRoundNumberAsc(app.getId())).thenReturn(List.of(passed));
        assertEquals(0, service.reopenPrematurelyFinalizedApplications(auditionId));
        assertEquals("FINAL_PASSED", app.getFinalStatus());
    }
}
