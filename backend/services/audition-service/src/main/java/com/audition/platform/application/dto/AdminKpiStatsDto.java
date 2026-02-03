package com.audition.platform.application.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminKpiStatsDto {
    private long totalAuditions;
    private long ongoingAuditions;
    private long finishedAuditions;
    private long waitingOpeningAuditions;
    private long writingAuditions;
    private long underScreeningAuditions;

    private long totalApplications;
    private long completedApplications;
    private long cancelledApplications;
    private long incompletePaymentApplications;
    private long writingApplications;

    private long finalPassCount;
    private long finalFailCount;
}

