package com.audition.platform.application;

import com.audition.platform.api.dto.AgencyApplicantItemDto;
import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationAgencyDetailDto;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ApplicationSnsLinkItem;
import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.api.dto.ApplicationVideoItem;
import com.audition.platform.api.dto.CreateApplicationRequest;
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
import com.audition.platform.domain.audition.ApplicationStatusHistory;
import com.audition.platform.domain.audition.ApplicationStatusHistoryRepository;
import com.audition.platform.domain.audition.ApplicationSnsLink;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private static final List<String> STANDARD_MANAGE_CATEGORIES = List.of("보컬", "댄스", "랩", "프로듀싱");

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final ApplicationScoreRepository applicationScoreRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final ApplicationStatusHistoryRepository applicationStatusHistoryRepository;
    private final AuditionRoundRepository auditionRoundRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationRankingService applicationRankingService,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            ApplicationStatusHistoryRepository applicationStatusHistoryRepository,
            AuditionRoundRepository auditionRoundRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationRankingService = applicationRankingService;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.applicationStatusHistoryRepository = applicationStatusHistoryRepository;
        this.auditionRoundRepository = auditionRoundRepository;
    }

    private void recordApplicationStatusChange(
            UUID applicationId, String previousDb, String nextDb, UUID actorId) {
        ApplicationStatusHistory row = new ApplicationStatusHistory();
        row.setApplicationId(applicationId);
        row.setPreviousStatus(previousDb != null ? previousDb : "");
        row.setNextStatus(nextDb);
        row.setChangedBy(actorId);
        row.setChangedAt(Instant.now());
        applicationStatusHistoryRepository.save(row);
    }

    private static ApplicationResponse toResponse(Application app, User applicant) {
        ApplicationResponse r = new ApplicationResponse();
        r.setId(app.getId());
        r.setAuditionId(app.getAuditionId());
        r.setApplicantId(app.getApplicantId());
        r.setApplicantEmail(applicant != null ? applicant.getEmail() : null);
        r.setStatus(app.getStatus());
        r.setMessage(app.getMessage());
        r.setUpdatedAt(app.getUpdatedAt());
        r.setCreatedAt(app.getCreatedAt());
        r.setName(app.getApplicantName());
        r.setBirthDate(app.getBirthDate() != null ? app.getBirthDate().toString() : null);
        r.setAge(app.getAge());
        r.setNationality(app.getNationality());
        r.setIntroText(app.getIntroText());
        r.setVideoUrl(app.getVideoUrl());
        return r;
    }

    private static ApplicationVideoItem toApplicationVideoItem(ApplicationVideo v) {
        ApplicationVideoItem item = new ApplicationVideoItem();
        item.setId(v.getId());
        item.setTitle(v.getTitle());
        item.setVideoUrl(v.getVideoUrl());
        item.setThumbnailUrl(v.getThumbnailUrl());
        return item;
    }

    /**
     * 공개 투표 화면에서 대표 영상(application_videos 최신 1건) 조회수 +1.
     * application_videos 행이 없으면 무시. 오디션이 OPEN일 때만 반영.
     */
    @Transactional
    public void incrementRepresentativeVideoView(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            return;
        }
        Optional<ApplicationVideo> videoOpt =
                applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(applicationId);
        if (videoOpt.isEmpty()) {
            return;
        }
        ApplicationVideo video = videoOpt.get();
        video.setViewCount(video.getViewCount() + 1);
        video.setUpdatedAt(Instant.now());
        applicationVideoRepository.save(video);
        applicationRankingService.recalculateScores(app.getAuditionId());
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

    /**
     * 기획사/관리자용 지원자 카드 목록 (화면 DTO)
     */
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

    /**
     * 기획사 지원자 관리 화면 (통계·카테고리·추천 점수 포함).
     * 보드 필터: minAge, maxAge, nationality, hasSns, boardStatus(PENDING|REVIEWING|APPROVED|REJECTED)
     * @param roundFilter {@code null} 또는 1 미만이면 전체, 그렇지 않으면 {@code applications.current_round_number} 일치만
     */
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

    /**
     * PATCH: 기획사 보드 상태. {@link MeApiMapping#agencyBoardStatusToDb} 규칙 적용.
     * 소유자·관리자는 합격/불합격 이후에도 언제든 상태를 변경할 수 있다.
     */
    @Transactional
    public ApplicationStatusPatchDataDto patchApplicationStatus(UUID applicationId, String apiStatus) {
        String dbTarget = MeApiMapping.agencyBoardStatusToDb(apiStatus.trim());
        if (dbTarget == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 상태입니다.");
        }
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        if (!"REVIEWING".equals(dbTarget)
                && !"ACCEPTED".equals(dbTarget)
                && !"REJECTED".equals(dbTarget)
                && !"SUBMITTED".equals(dbTarget)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 상태입니다.");
        }

        String previousDb = app.getStatus();
        app.setStatus(dbTarget);
        app.setUpdatedAt(java.time.Instant.now());
        app = applicationRepository.save(app);
        recordApplicationStatusChange(applicationId, previousDb, dbTarget, currentUserId);
        applicationRankingService.recalculateScores(app.getAuditionId());
        return new ApplicationStatusPatchDataDto(
                app.getId().toString(),
                MeApiMapping.agencyBoardStatusToApi(app.getStatus())
        );
    }

    public ApplicationAgencyDetailDto getApplicationAgencyDetail(UUID applicationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var m = metricsLoader.resolve(app);
        String displayName = applicant != null ? applicant.getPublicDisplayLabel() : "";
        if (StringUtils.hasText(app.getApplicantName())) {
            displayName = app.getApplicantName();
        }

        ApplicationAgencyDetailDto dto = new ApplicationAgencyDetailDto();
        dto.setId(app.getId().toString());
        dto.setAuditionId(app.getAuditionId().toString());
        dto.setName(displayName);
        if (app.getBirthDate() != null) {
            dto.setBirthDate(app.getBirthDate().toString());
        }
        dto.setAge(app.getAge());
        dto.setNationality(app.getNationality());
        dto.setVideoUrl(m.videoUrl());
        dto.setThumbnailUrl(m.thumbnailUrl());
        dto.setIntroText(app.getIntroText());
        dto.setStatus(MeApiMapping.agencyBoardStatusToApi(app.getStatus()));
        dto.setRound(app.getCurrentRoundNumber());
        dto.setCreatedAt(app.getCreatedAt() != null ? app.getCreatedAt().toString() : null);

        List<ApplicationSnsLink> links = applicationSnsLinkRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        List<ApplicationAgencyDetailDto.SnsLinkRow> rows = new ArrayList<>();
        for (ApplicationSnsLink link : links) {
            ApplicationAgencyDetailDto.SnsLinkRow row = new ApplicationAgencyDetailDto.SnsLinkRow();
            row.setPlatform(link.getPlatform());
            row.setUrl(link.getUrl());
            rows.add(row);
        }
        dto.setSnsLinks(rows);
        return dto;
    }

    /**
     * 레거시 원클릭 지원. 신규 UX는 {@link #submitApplication(CreateApplicationRequest)} 만 사용합니다.
     */
    @Transactional
    public ApplicationResponse apply(UUID auditionId) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "지원서 작성 후 제출해 주세요. 「지원하기」 화면에서 정보를 입력할 수 있습니다.");
    }

    @Deprecated
    public ApplicationResponse submitApplication(CreateApplicationRequest req) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "submitApplication은 ApplicationSubmitService 경유만 허용됩니다.");
    }

    public List<ApplicationResponse> listMyApplications() {
        UUID applicantId = SecurityUtils.getCurrentUserId();
        if (applicantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only APPLICANT or ADMIN can view my applications");
        }
        List<Application> list = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(applicantId);
        return list.stream()
                .map(app -> {
                    Audition a = auditionRepository.findById(app.getAuditionId()).orElse(null);
                    User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
                    ApplicationResponse r = toResponse(app, applicant);
                    if (a != null) {
                        r.setAuditionTitle(a.getTitle());
                    }
                    return r;
                })
                .collect(Collectors.toList());
    }

    /**
     * @deprecated 내부/레거시용. 기획사 UI는 {@link #listAgencyApplicants(UUID)} 사용.
     */
    public List<ApplicationResponse> listByAudition(UUID auditionId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        assertAgencyOrAdminCanManageAudition(audition);
        List<Application> list = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        return list.stream()
                .map(app -> {
                    User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
                    return toResponse(app, applicant);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponse decide(UUID applicationId, String decisionStatus) {
        if (!"ACCEPTED".equals(decisionStatus) && !"REJECTED".equals(decisionStatus)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Decision status must be ACCEPTED or REJECTED");
        }
        return updateStatusInternal(applicationId, decisionStatus);
    }

    @Transactional
    public ApplicationResponse markReviewed(UUID applicationId) {
        return updateStatusInternal(applicationId, "REVIEWING");
    }

    private ApplicationResponse updateStatusInternal(UUID applicationId, String newStatus) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!audition.getOwnerId().equals(currentUserId) && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only audition owner can accept/reject");
        }
        String previousDb = app.getStatus();
        app.setStatus(newStatus);
        app.setUpdatedAt(java.time.Instant.now());
        app = applicationRepository.save(app);
        recordApplicationStatusChange(applicationId, previousDb, newStatus, currentUserId);
        applicationRankingService.recalculateScores(app.getAuditionId());
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        return toResponse(app, applicant);
    }

    public ApplicationResponse getApplicationForApplicantOrOwner(UUID applicationId) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));

        boolean isApplicant = app.getApplicantId().equals(currentUserId);
        boolean isOwner = audition.getOwnerId().equals(currentUserId);
        boolean isAdmin = SecurityUtils.hasRole("ADMIN");
        if (!isApplicant && !isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access this application");
        }

        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        ApplicationResponse response = toResponse(app, applicant);
        response.setAuditionTitle(audition.getTitle());

        List<ApplicationVideo> videoRows =
                applicationVideoRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
        response.setVideos(videoRows.stream()
                .map(ApplicationService::toApplicationVideoItem)
                .collect(Collectors.toList()));
        if (!videoRows.isEmpty()) {
            response.setVideoUrl(videoRows.get(0).getVideoUrl());
        }

        List<ApplicationSnsLink> snsRows =
                applicationSnsLinkRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        List<ApplicationSnsLinkItem> snsItems = new ArrayList<>();
        for (ApplicationSnsLink link : snsRows) {
            ApplicationSnsLinkItem row = new ApplicationSnsLinkItem();
            row.setPlatform(link.getPlatform());
            row.setUrl(link.getUrl());
            snsItems.add(row);
        }
        response.setSnsLinks(snsItems);

        return response;
    }
}
