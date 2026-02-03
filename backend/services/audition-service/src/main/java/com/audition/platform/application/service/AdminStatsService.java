package com.audition.platform.application.service;

import com.audition.platform.application.dto.AdminKpiStatsDto;
import com.audition.platform.domain.entity.Application;
import com.audition.platform.domain.entity.Audition;
import com.audition.platform.domain.repository.ApplicationRepository;
import com.audition.platform.domain.repository.AuditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;

    public AdminKpiStatsDto getKpiStats() {
        return AdminKpiStatsDto.builder()
                .totalAuditions(auditionRepository.count())
                .ongoingAuditions(auditionRepository.countByStatus(Audition.AuditionStatus.ONGOING))
                .finishedAuditions(auditionRepository.countByStatus(Audition.AuditionStatus.FINISHED))
                .waitingOpeningAuditions(auditionRepository.countByStatus(Audition.AuditionStatus.WAITING_OPENING))
                .writingAuditions(auditionRepository.countByStatus(Audition.AuditionStatus.WRITING))
                .underScreeningAuditions(auditionRepository.countByStatus(Audition.AuditionStatus.UNDER_SCREENING))
                .totalApplications(applicationRepository.count())
                .completedApplications(applicationRepository.countByStatus(Application.ApplicationStatus.APPLICATION_COMPLETED))
                .cancelledApplications(applicationRepository.countByStatus(Application.ApplicationStatus.CANCEL))
                .incompletePaymentApplications(applicationRepository.countByStatus(Application.ApplicationStatus.INCOMPLETE_PAYMENT))
                .writingApplications(applicationRepository.countByStatus(Application.ApplicationStatus.WRITING))
                .finalPassCount(applicationRepository.countByFinalResult(Application.ScreeningResult.PASS))
                .finalFailCount(applicationRepository.countByFinalResult(Application.ScreeningResult.FAIL))
                .build();
    }
}

