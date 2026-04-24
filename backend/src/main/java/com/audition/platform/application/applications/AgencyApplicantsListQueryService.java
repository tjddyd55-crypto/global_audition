package com.audition.platform.application.applications;

import com.audition.platform.api.dto.AgencyApplicantItemDto;
import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** 기획사/관리자 지원자 단순 목록 조회 유스케이스. */
@Service
public class AgencyApplicantsListQueryService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final ApplicationScoreRepository applicationScoreRepository;

    public AgencyApplicantsListQueryService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            ApplicationScoreRepository applicationScoreRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.applicationScoreRepository = applicationScoreRepository;
    }

    public AgencyApplicantsListDto listAgencyApplicants(UUID auditionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        List<Application> list = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream()
                .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));
        Map<UUID, Long> snsMap = snsCountsByApplicationIds(list);

        AgencyApplicantsListDto out = new AgencyApplicantsListDto();
        out.setItems(list.stream()
                .map(app -> toAgencyItem(app, scoreByApp.get(app.getId()), snsMap.getOrDefault(app.getId(), 0L)))
                .collect(Collectors.toList()));
        return out;
    }

    private void assertAgencyOrAdminCanManageAudition(Audition audition) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자는 이 작업을 수행할 수 없습니다.");
        }
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "해당 오디션을 관리할 권한이 없습니다.");
        }
    }

    private Map<UUID, Long> snsCountsByApplicationIds(List<Application> apps) {
        if (apps.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = apps.stream().map(Application::getId).collect(Collectors.toList());
        Map<UUID, Long> map = new HashMap<>();
        for (UUID id : ids) {
            map.put(id, 0L);
        }
        List<Object[]> rows = applicationSnsLinkRepository.countGroupedByApplicationIdIn(ids);
        for (Object[] row : rows) {
            map.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private AgencyApplicantItemDto toAgencyItem(Application app, ApplicationScore score, long snsCount) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var metrics = metricsLoader.resolve(app);

        AgencyApplicantItemDto dto = new AgencyApplicantItemDto();
        dto.setApplicationId(app.getId().toString());
        String displayName = applicant != null ? applicant.getPublicDisplayLabel() : "";
        if (StringUtils.hasText(app.getApplicantName())) {
            displayName = app.getApplicantName();
        }
        dto.setUserName(displayName);
        dto.setName(displayName);
        dto.setUserEmail(applicant != null ? applicant.getEmail() : "");
        dto.setVideoUrl(metrics.videoUrl());
        dto.setThumbnailUrl(metrics.thumbnailUrl());
        dto.setCategory(metrics.category());
        dto.setViewCount(metrics.viewCount());
        dto.setLikeCount(metrics.likeCount());
        dto.setVoteCount(app.getVoteCount());
        dto.setAge(app.getAge());
        dto.setNationality(app.getNationality());
        dto.setSnsCount((int) snsCount);
        dto.setCreatedAt(app.getCreatedAt() != null ? app.getCreatedAt().toString() : null);
        dto.setStatus(MeApiMapping.agencyBoardStatusToApi(app.getStatus()));
        dto.setRound(app.getCurrentRoundNumber());
        dto.setVoted(false);
        if (score != null) {
            dto.setRecommendedScore(score.getWeightedScore());
            dto.setRecommendedRank(score.getRecommendedRank());
            dto.setRank(score.getRecommendedRank());
            dto.setRecommended(score.isRecommended());
        } else {
            dto.setRecommendedScore(0.0);
            dto.setRecommendedRank(0);
            dto.setRank(0);
            dto.setRecommended(false);
        }
        return dto;
    }
}
