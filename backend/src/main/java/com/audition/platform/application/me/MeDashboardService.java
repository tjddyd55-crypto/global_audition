package com.audition.platform.application.me;

import com.audition.platform.api.dto.me.MeDashboardResponse;
import com.audition.platform.api.dto.me.MeDashboardStatsDto;
import com.audition.platform.api.dto.me.MyApplicationRecentDto;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MeDashboardService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final ChannelVideoRepository channelVideoRepository;

    public MeDashboardService(ApplicationRepository applicationRepository,
                              AuditionRepository auditionRepository,
                              ChannelVideoRepository channelVideoRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.channelVideoRepository = channelVideoRepository;
    }

    public MeDashboardResponse getDashboard() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자 대시보드에 접근할 수 없습니다.");
        }

        MeDashboardStatsDto stats = new MeDashboardStatsDto();
        stats.setAppliedCount(applicationRepository.countByApplicantId(userId));
        stats.setReviewingCount(applicationRepository.countByApplicantIdAndStatus(userId, "REVIEWING"));
        stats.setAcceptedCount(applicationRepository.countByApplicantIdAndStatus(userId, "ACCEPTED"));
        stats.setRejectedCount(applicationRepository.countByApplicantIdAndStatus(userId, "REJECTED"));
        stats.setVideoCount(channelVideoRepository.countByOwnerId(userId));

        List<Application> recent = applicationRepository.findTop10ByApplicantIdOrderByCreatedAtDesc(userId).stream()
                .limit(5)
                .collect(Collectors.toList());
        List<UUID> auditionIds = recent.stream().map(Application::getAuditionId).distinct().collect(Collectors.toList());
        Map<UUID, Audition> auditionMap = auditionIds.isEmpty()
                ? Collections.emptyMap()
                : auditionRepository.findAllById(auditionIds).stream()
                .collect(Collectors.toMap(Audition::getId, a -> a, (a, b) -> a));

        List<MyApplicationRecentDto> items = recent.stream().map(app -> {
            MyApplicationRecentDto dto = new MyApplicationRecentDto();
            dto.setApplicationId(app.getId().toString());
            dto.setAuditionId(app.getAuditionId().toString());
            Audition au = auditionMap.get(app.getAuditionId());
            dto.setAuditionTitle(au != null ? au.getTitle() : "");
            dto.setAppliedAt(app.getCreatedAt());
            dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
            return dto;
        }).collect(Collectors.toList());

        MeDashboardResponse response = new MeDashboardResponse();
        response.setStats(stats);
        response.setRecentApplications(items);
        return response;
    }
}
