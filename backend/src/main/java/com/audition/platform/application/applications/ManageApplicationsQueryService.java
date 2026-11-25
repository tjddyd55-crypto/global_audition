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
import com.audition.platform.application.round.AuditionManageAccess;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRound;
import com.audition.platform.domain.audition.AuditionRoundRepository;
import com.audition.platform.domain.score.ApplicationScore;
import com.audition.platform.domain.score.ApplicationScoreRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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

    private final org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc;
    private final ApplicationShortlistService shortlists;
    private final ApplicationEntryNumbers entryNumbers;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final AuditionRoundRepository auditionRoundRepository;
    private final AuditionManageAccess auditionManageAccess;

    public ManageApplicationsQueryService(
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationRankingService applicationRankingService,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            AuditionRoundRepository auditionRoundRepository,
            AuditionManageAccess auditionManageAccess,
            ApplicationEntryNumbers entryNumbers, ApplicationShortlistService shortlists, org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.shortlists = shortlists;
        this.entryNumbers = entryNumbers;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationRankingService = applicationRankingService;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.auditionRoundRepository = auditionRoundRepository;
        this.auditionManageAccess = auditionManageAccess;
    }

    public ManageApplicationsPageDataDto listManageApplications(
            UUID auditionId,
            String categoryFilter,
            Integer minAge,
            Integer maxAge,
            String nationalityFilter,
            Boolean hasSns,
            String boardStatus,
            Integer roundFilter, Integer applicantNumber) {
        return listManageApplications(auditionId, categoryFilter, minAge, maxAge, nationalityFilter, hasSns, boardStatus, roundFilter, applicantNumber, false, null, null, 0, 50);
    }

    public ManageApplicationsPageDataDto listManageApplications(UUID auditionId, String categoryFilter, Integer minAge, Integer maxAge, String nationalityFilter, Boolean hasSns, String boardStatus, Integer roundFilter, Integer applicantNumber, boolean savedOnly, String name, String sort, int page, int size) {
        Audition audition = auditionManageAccess.requireApplicantList(auditionId);
        if (page < 0 || size < 1 || size > 100) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "페이지 범위가 올바르지 않습니다.");
        int scope = roundFilter != null && roundFilter > 0 ? roundFilter : 0;
        boolean canReview = audition.getOwnerId().equals(com.audition.platform.infra.SecurityUtils.getCurrentUserId()) || com.audition.platform.infra.SecurityUtils.hasRole("ADMIN");
        Map<UUID, ApplicationShortlistService.Saved> saved = canReview ? shortlists.list(auditionId, scope) : Map.of();
        if (savedOnly && !canReview) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);


        var args = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource()
            .addValue("audition", auditionId).addValue("scope", scope).addValue("agency", audition.getOwnerId());
        long totalApplicants = jdbc.queryForObject("SELECT COUNT(*) FROM applications WHERE audition_id=:audition", args, Long.class);
        if (applicationScoreRepository.countByAuditionId(auditionId) == 0 && totalApplicants > 0) applicationRankingService.recalculateScores(auditionId);
        String base = """
            FROM applications a JOIN users u ON u.id=a.applicant_id
            JOIN application_entry_numbers n ON n.application_id=a.id AND n.round_number=:scope
            LEFT JOIN application_scores sc ON sc.application_id=a.id
            LEFT JOIN LATERAL (SELECT category FROM application_videos WHERE application_id=a.id ORDER BY created_at DESC LIMIT 1) av ON TRUE
            LEFT JOIN LATERAL (SELECT category FROM channel_videos WHERE owner_id=a.applicant_id ORDER BY updated_at DESC LIMIT 1) cv ON TRUE
            WHERE a.audition_id=:audition
            """;
        String categoryExpr = "COALESCE(NULLIF(TRIM(av.category),''),NULLIF(TRIM(cv.category),''),'')";
        String displayName = "COALESCE(NULLIF(TRIM(a.applicant_name),''),NULLIF(TRIM(u.nickname),''),split_part(u.email,'@',1),'사용자')";
        String where = "";
        if (savedOnly) where += " AND EXISTS(SELECT 1 FROM application_shortlists ss WHERE ss.agency_user_id=:agency AND ss.audition_id=a.audition_id AND ss.application_id=a.id AND ss.round_number=:scope)";
        if (applicantNumber != null) { where += " AND n.entry_number=:number"; args.addValue("number", applicantNumber); }
        if (StringUtils.hasText(name)) { where += " AND POSITION(:name IN LOWER(" + displayName + "))>0"; args.addValue("name", name.trim().toLowerCase(Locale.ROOT)); }
        if (StringUtils.hasText(categoryFilter) && !"전체".equals(categoryFilter.trim())) { where += " AND " + categoryExpr + "=:category"; args.addValue("category", categoryFilter.trim()); }
        if (minAge != null) { where += " AND a.age>=:minAge"; args.addValue("minAge", minAge); }
        if (maxAge != null) { where += " AND a.age<=:maxAge"; args.addValue("maxAge", maxAge); }
        if (StringUtils.hasText(nationalityFilter)) { where += " AND UPPER(a.nationality)=:nationality"; args.addValue("nationality", nationalityFilter.trim().toUpperCase(Locale.ROOT)); }
        if (hasSns != null) where += " AND " + (hasSns ? "" : "NOT ") + "EXISTS(SELECT 1 FROM application_sns_links l WHERE l.application_id=a.id)";
        if (StringUtils.hasText(boardStatus)) { where += " AND (CASE a.status WHEN 'SUBMITTED' THEN 'PENDING' WHEN 'ACCEPTED' THEN 'APPROVED' WHEN 'REVIEWED' THEN 'REVIEWING' ELSE a.status END)=:status"; args.addValue("status", boardStatus.trim().toUpperCase(Locale.ROOT)); }
        String order = switch (sort == null ? "NEWEST" : sort) {
            case "NUMBER" -> "n.entry_number ASC";
            case "NAME" -> displayName + " ASC, a.id ASC";
            case "SCORE" -> "COALESCE(sc.weighted_score,0) DESC, a.id ASC";
            default -> "a.created_at DESC, a.id ASC";
        };
        long totalElements = jdbc.queryForObject("SELECT COUNT(*) " + base + where, args, Long.class);
        args.addValue("limit", size).addValue("offset", (long)page * size);
        List<UUID> ids = jdbc.query("SELECT a.id " + base + where + " ORDER BY " + order + " LIMIT :limit OFFSET :offset", args, (rs, row) -> rs.getObject(1, UUID.class));
        Map<UUID, Application> byId = applicationRepository.findAllById(ids).stream().collect(Collectors.toMap(Application::getId, Function.identity()));
        List<Application> pageApps = ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream().collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (x,y)->x));
        Map<UUID, Long> snsMap = snsCountsByApplicationIds(pageApps);
        Map<UUID, Integer> numbers = entryNumbers.forScope(auditionId, scope);
        List<AgencyApplicantItemDto> visible = pageApps.stream().map(app -> {
            var item = toAgencyItem(app, scoreByApp.get(app.getId()), snsMap.getOrDefault(app.getId(),0L));
            item.setApplicantNumber(numbers.get(app.getId())); item.setNumberScopeRound(scope); item.setShortlisted(saved.containsKey(app.getId())); return item;
        }).toList();
        Map<Integer, Long> countsByRound = entryNumbers.roundCounts(auditionId);
        int maxRound = Math.max(audition.getMaxRoundNumber() == null ? 1 : audition.getMaxRoundNumber(), countsByRound.keySet().stream().mapToInt(Integer::intValue).max().orElse(1));
        maxRound = Math.max(maxRound, auditionRoundRepository.findByAuditionIdOrderByRoundNumberAsc(auditionId).stream().mapToInt(AuditionRound::getRoundNumber).max().orElse(1));
        List<ManageRoundCountDto> roundCounts = new ArrayList<>();
        for (int n=1; n<=maxRound; n++) roundCounts.add(new ManageRoundCountDto(n, countsByRound.getOrDefault(n,0L)));
        ManageApplicationStatsDto stats = new ManageApplicationStatsDto(); stats.setTotal(totalApplicants);
        jdbc.query("SELECT status,COUNT(*) AS cnt FROM applications WHERE audition_id=:audition GROUP BY status", args, (org.springframework.jdbc.core.RowCallbackHandler) rs -> {
            long count=rs.getLong("cnt"); switch(rs.getString("status")) { case "SUBMITTED" -> stats.setSubmitted(count); case "REVIEWING" -> stats.setReviewing(count); case "ACCEPTED" -> stats.setAccepted(count); case "REJECTED" -> stats.setRejected(count); default -> {} }
        });
        List<CategoryCountDto> categories = new ArrayList<>(); categories.add(new CategoryCountDto("전체", totalApplicants));
        // Category totals retain the existing all-applicant meaning, independent of review filters.
        var catArgs = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource("audition",auditionId).addValue("scope",0);
        Map<String, Long> catCounts = new HashMap<>();
        jdbc.query("SELECT " + categoryExpr + " AS category, COUNT(*) AS cnt " + base + " GROUP BY " + categoryExpr, catArgs, (org.springframework.jdbc.core.RowCallbackHandler) rs -> catCounts.put(rs.getString("category"),rs.getLong("cnt")));
        for (String category : STANDARD_MANAGE_CATEGORIES) categories.add(new CategoryCountDto(category,catCounts.getOrDefault(category,0L)));
        ManageApplicationsPageDataDto dto = new ManageApplicationsPageDataDto();
        dto.setShortlistCount(saved.size());
        dto.setTotalElements(totalElements);
        dto.setPage(page);
        dto.setSize(size);
        dto.setTotalPages((int)((totalElements + size - 1) / size));
        ManageAuditionHeaderDto header = new ManageAuditionHeaderDto();
        header.setId(audition.getId().toString());
        header.setTitle(audition.getTitle() != null ? audition.getTitle() : "");
        header.setDescription(audition.getDescription() != null ? audition.getDescription() : "");
        header.setProcessMode(audition.getProcessMode() != null ? audition.getProcessMode() : "SINGLE");
        header.setMaxRoundNumber(audition.getMaxRoundNumber());
        dto.setAudition(header);
        dto.setStats(stats);
        dto.setCategories(categories);
        dto.setItems(visible);
        dto.setApplicantTotalCount(totalApplicants);
        dto.setMaxRound(maxRound);
        dto.setRoundCounts(roundCounts);
        return dto;
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
