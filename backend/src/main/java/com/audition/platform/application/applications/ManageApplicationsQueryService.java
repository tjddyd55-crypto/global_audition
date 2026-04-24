package com.audition.platform.application.applications;

import com.audition.platform.api.dto.AgencyApplicantItemDto;
import com.audition.platform.api.dto.CategoryCountDto;
import com.audition.platform.api.dto.ManageApplicationStatsDto;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.api.dto.ManageAuditionHeaderDto;
import com.audition.platform.api.dto.ManageRoundCountDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.ranking.ApplicationRankingService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 기획사/관리자 지원자 관리 보드 조회 유스케이스.
 *
 * <p>통계, 차수, 필터링, 카드 DTO 조립 로직을 담당한다.</p>
 */
@Service
public class ManageApplicationsQueryService {

    private static final List<String> STANDARD_MANAGE_CATEGORIES = List.of("보컬", "댄스", "랩", "프로듀싱");

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final AuditionRoundRepository auditionRoundRepository;

    public ManageApplicationsQueryService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationRankingService applicationRankingService,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            AuditionRoundRepository auditionRoundRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationRankingService = applicationRankingService;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.auditionRoundRepository = auditionRoundRepository;
    }

    public ManageApplicationsPageDataDto listManageApplications(
            UUID auditionId,
            String categoryFilter,
            Integer minAge,
            Integer maxAge,
            String nationalityFilter,
            Boolean hasSns,
            String boardStatus,
            Integer roundFilter) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        List<Application> all = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        if (applicationScoreRepository.countByAuditionId(auditionId) == 0 && !all.isEmpty()) {
            applicationRankingService.recalculateScores(auditionId);
        }
        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream()
                .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));

        List<AuditionRound> definedRounds = auditionRoundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId);
        int maxRound = resolveMaxRoundForManage(audition, all, definedRounds);
        List<ManageRoundCountDto> roundCounts = buildRoundCountsForManage(all, maxRound);

        Map<UUID, Long> snsMap = snsCountsByApplicationIds(all);
        List<AgencyApplicantItemDto> fullItems = all.stream()
                .map(app -> toAgencyItem(app, scoreByApp.get(app.getId()), snsMap.getOrDefault(app.getId(), 0L)))
                .collect(Collectors.toList());

        List<AgencyApplicantItemDto> boardFiltered =
                filterManageBoard(fullItems, minAge, maxAge, nationalityFilter, hasSns, boardStatus);
        List<AgencyApplicantItemDto> roundFiltered = filterManageByRound(boardFiltered, roundFilter);
        List<AgencyApplicantItemDto> visible = filterManageByCategory(roundFiltered, categoryFilter);

        ManageApplicationsPageDataDto dto = new ManageApplicationsPageDataDto();
        ManageAuditionHeaderDto header = new ManageAuditionHeaderDto();
        header.setId(audition.getId().toString());
        header.setTitle(audition.getTitle() != null ? audition.getTitle() : "");
        header.setDescription(audition.getDescription() != null ? audition.getDescription() : "");
        header.setProcessMode(audition.getProcessMode() != null ? audition.getProcessMode() : "SINGLE");
        header.setMaxRoundNumber(audition.getMaxRoundNumber());
        dto.setAudition(header);
        dto.setStats(buildManageStats(all));
        dto.setCategories(buildManageCategoryTabs(fullItems));
        dto.setItems(visible);
        dto.setApplicantTotalCount(all.size());
        dto.setMaxRound(maxRound);
        dto.setRoundCounts(roundCounts);
        return dto;
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

    private static int resolveMaxRoundForManage(Audition audition, List<Application> apps, List<AuditionRound> definedRounds) {
        int max = 1;
        for (Application app : apps) {
            max = Math.max(max, app.getCurrentRoundNumber());
        }
        if (audition.getMaxRoundNumber() != null && audition.getMaxRoundNumber() > 0) {
            max = Math.max(max, audition.getMaxRoundNumber());
        }
        for (AuditionRound r : definedRounds) {
            max = Math.max(max, r.getRoundNumber());
        }
        return Math.max(1, max);
    }

    private static List<ManageRoundCountDto> buildRoundCountsForManage(List<Application> apps, int maxRound) {
        long[] counts = new long[maxRound + 1];
        for (Application app : apps) {
            int r = app.getCurrentRoundNumber();
            if (r < 1) {
                r = 1;
            }
            if (r > maxRound) {
                r = maxRound;
            }
            counts[r]++;
        }
        List<ManageRoundCountDto> out = new ArrayList<>();
        for (int i = 1; i <= maxRound; i++) {
            out.add(new ManageRoundCountDto(i, counts[i]));
        }
        return out;
    }

    private static List<AgencyApplicantItemDto> filterManageByRound(List<AgencyApplicantItemDto> items, Integer round) {
        if (round == null || round < 1) {
            return items;
        }
        final int want = round;
        return items.stream().filter(i -> i.getRound() == want).collect(Collectors.toList());
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

    private static List<AgencyApplicantItemDto> filterManageBoard(
            List<AgencyApplicantItemDto> items,
            Integer minAge,
            Integer maxAge,
            String nationalityFilter,
            Boolean hasSns,
            String boardStatus) {
        return items.stream()
                .filter(i -> minAge == null || (i.getAge() != null && i.getAge() >= minAge))
                .filter(i -> maxAge == null || (i.getAge() != null && i.getAge() <= maxAge))
                .filter(i -> {
                    if (!StringUtils.hasText(nationalityFilter)) {
                        return true;
                    }
                    String want = nationalityFilter.trim().toUpperCase(Locale.ROOT);
                    String nat = i.getNationality() != null ? i.getNationality().toUpperCase(Locale.ROOT) : "";
                    return want.equals(nat);
                })
                .filter(i -> {
                    if (hasSns == null) {
                        return true;
                    }
                    return hasSns ? i.getSnsCount() > 0 : i.getSnsCount() == 0;
                })
                .filter(i -> {
                    if (!StringUtils.hasText(boardStatus)) {
                        return true;
                    }
                    String want = boardStatus.trim().toUpperCase(Locale.ROOT);
                    return want.equals(i.getStatus());
                })
                .collect(Collectors.toList());
    }

    private static List<AgencyApplicantItemDto> filterManageByCategory(List<AgencyApplicantItemDto> items, String categoryFilter) {
        if (!StringUtils.hasText(categoryFilter) || "전체".equals(categoryFilter.trim())) {
            return items;
        }
        String want = categoryFilter.trim();
        return items.stream()
                .filter(i -> want.equals((i.getCategory() != null ? i.getCategory() : "").trim()))
                .collect(Collectors.toList());
    }

    private static ManageApplicationStatsDto buildManageStats(List<Application> apps) {
        long sub = 0;
        long rev = 0;
        long acc = 0;
        long rej = 0;
        for (Application a : apps) {
            String st = a.getStatus();
            if ("SUBMITTED".equals(st)) {
                sub++;
            } else if ("REVIEWING".equals(st)) {
                rev++;
            } else if ("ACCEPTED".equals(st)) {
                acc++;
            } else if ("REJECTED".equals(st)) {
                rej++;
            }
        }
        ManageApplicationStatsDto s = new ManageApplicationStatsDto();
        s.setTotal(apps.size());
        s.setSubmitted(sub);
        s.setReviewing(rev);
        s.setAccepted(acc);
        s.setRejected(rej);
        return s;
    }

    private List<CategoryCountDto> buildManageCategoryTabs(List<AgencyApplicantItemDto> items) {
        List<CategoryCountDto> tabs = new ArrayList<>();
        tabs.add(new CategoryCountDto("전체", items.size()));
        for (String c : STANDARD_MANAGE_CATEGORIES) {
            long n = items.stream()
                    .filter(i -> c.equals((i.getCategory() != null ? i.getCategory() : "").trim()))
                    .count();
            tabs.add(new CategoryCountDto(c, n));
        }
        return tabs;
    }

    private AgencyApplicantItemDto toAgencyItem(Application app, ApplicationScore score, long snsCount) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var m = metricsLoader.resolve(app);

        AgencyApplicantItemDto dto = new AgencyApplicantItemDto();
        dto.setApplicationId(app.getId().toString());
        String displayName = applicant != null ? applicant.getPublicDisplayLabel() : "";
        if (StringUtils.hasText(app.getApplicantName())) {
            displayName = app.getApplicantName();
        }
        dto.setUserName(displayName);
        dto.setName(displayName);
        dto.setUserEmail(applicant != null ? applicant.getEmail() : "");
        dto.setVideoUrl(m.videoUrl());
        dto.setThumbnailUrl(m.thumbnailUrl());
        dto.setCategory(m.category());
        dto.setViewCount(m.viewCount());
        dto.setLikeCount(m.likeCount());
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
