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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApplicationRoundSubmissionBackfillTest {

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
    void backfillCreatesMissingRound1RowsForExistingApplications() {
        UUID auditionId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setProcessMode("MULTI_ROUND");
        AuditionRound round1 = new AuditionRound();
        round1.setId(UUID.randomUUID());
        round1.setAuditionId(auditionId);
        round1.setRoundNumber(1);
        Application app = new Application();
        app.setId(UUID.randomUUID());
        app.setAuditionId(auditionId);
        app.setCurrentRoundNumber(1);

        when(auditionRepository.findById(auditionId)).thenReturn(Optional.of(audition));
        when(roundRepository.findByAuditionIdAndRoundNumber(auditionId, 1)).thenReturn(Optional.of(round1));
        when(applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId)).thenReturn(List.of(app));
        when(submissionRepository.findByApplicationIdAndRoundId(app.getId(), round1.getId()))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any())).thenAnswer(inv -> {
            ApplicationRoundSubmission s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        assertEquals(1, service.backfillFirstRoundSubmissions(auditionId));
        verify(applicationRepository).save(app);
        assertNotNull(app.getLatestRoundSubmissionId());
        assertEquals(1, app.getCurrentRoundNumber());
    }

    @Test
    void backfillSkipsApplicationsThatAlreadyHaveARow() {
        UUID auditionId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setProcessMode("MULTI_ROUND");
        AuditionRound round1 = new AuditionRound();
        round1.setId(UUID.randomUUID());
        Application app = new Application();
        app.setId(UUID.randomUUID());
        ApplicationRoundSubmission existing = new ApplicationRoundSubmission();
        existing.setId(UUID.randomUUID());

        when(auditionRepository.findById(auditionId)).thenReturn(Optional.of(audition));
        when(roundRepository.findByAuditionIdAndRoundNumber(auditionId, 1)).thenReturn(Optional.of(round1));
        when(applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId)).thenReturn(List.of(app));
        when(submissionRepository.findByApplicationIdAndRoundId(app.getId(), round1.getId()))
                .thenReturn(Optional.of(existing));

        assertEquals(0, service.backfillFirstRoundSubmissions(auditionId));
        verify(submissionRepository, never()).save(any());
        verify(applicationRepository, never()).save(any());
    }

    @Test
    void backfillIsNoopForSingleProcessMode() {
        UUID auditionId = UUID.randomUUID();
        Audition audition = new Audition();
        audition.setId(auditionId);
        audition.setProcessMode("SINGLE");
        when(auditionRepository.findById(auditionId)).thenReturn(Optional.of(audition));

        assertEquals(0, service.backfillFirstRoundSubmissions(auditionId));
        verify(roundRepository, never()).findByAuditionIdAndRoundNumber(any(), any());
    }
}
