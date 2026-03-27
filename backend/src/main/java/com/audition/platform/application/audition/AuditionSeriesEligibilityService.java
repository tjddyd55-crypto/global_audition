package com.audition.platform.application.audition;

import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditionSeriesEligibilityService {

    private final ApplicationRepository applicationRepository;

    public AuditionSeriesEligibilityService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    /**
     * API 스펙상 round 1은 누구나, round &gt;= 2 는 이전 시장(round-1) 합격(ACCEPTED) 필요.
     */
    public boolean canApply(UUID applicantId, Audition audition) {
        if (audition.getSeriesRound() <= 1) {
            return true;
        }
        int prev = audition.getSeriesRound() - 1;
        return applicationRepository.countAcceptedInSeriesRound(applicantId, audition.getGroupId(), prev) > 0;
    }
}
