package com.audition.platform.application;

import com.audition.platform.api.dto.AgencyApplicantItemDto;
import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.api.dto.CategoryCountDto;
import com.audition.platform.api.dto.ManageApplicationStatsDto;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.api.dto.ManageAuditionHeaderDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.ranking.ApplicationScoringService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
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

import java.util.ArrayList;
import java.util.List;
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
    private final ApplicationScoringService applicationScoringService;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationScoreRepository applicationScoreRepository,
            ApplicationScoringService applicationScoringService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationScoreRepository = applicationScoreRepository;
        this.applicationScoringService = applicationScoringService;
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
        return r;
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
        AgencyApplicantsListDto out = new AgencyApplicantsListDto();
        out.setItems(list.stream().map(app -> toAgencyItem(app, scoreByApp.get(app.getId()))).collect(Collectors.toList()));
        return out;
    }

    /**
     * 기획사 지원자 관리 화면 (통계·카테고리·추천 점수 포함)
     */
    public ManageApplicationsPageDataDto listManageApplications(UUID auditionId, String categoryFilter) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        List<Application> all = applicationRepository.findByAuditionIdOrderByCreatedAtDesc(auditionId);
        if (applicationScoreRepository.countByAuditionId(auditionId) == 0 && !all.isEmpty()) {
            applicationScoringService.recalculateForAudition(auditionId);
        }
        Map<UUID, ApplicationScore> scoreByApp = applicationScoreRepository.findByAuditionId(auditionId).stream()
                .collect(Collectors.toMap(ApplicationScore::getApplicationId, Function.identity(), (a, b) -> a));

        List<AgencyApplicantItemDto> fullItems = all.stream()
                .map(app -> toAgencyItem(app, scoreByApp.get(app.getId())))
                .collect(Collectors.toList());

        List<AgencyApplicantItemDto> visible = filterManageByCategory(fullItems, categoryFilter);

        ManageApplicationsPageDataDto dto = new ManageApplicationsPageDataDto();
        ManageAuditionHeaderDto header = new ManageAuditionHeaderDto();
        header.setId(audition.getId().toString());
        header.setTitle(audition.getTitle() != null ? audition.getTitle() : "");
        dto.setAudition(header);
        dto.setStats(buildManageStats(all));
        dto.setCategories(buildManageCategoryTabs(fullItems));
        dto.setItems(visible);
        return dto;
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

    private AgencyApplicantItemDto toAgencyItem(Application app, ApplicationScore score) {
        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var m = metricsLoader.resolve(app);

        AgencyApplicantItemDto dto = new AgencyApplicantItemDto();
        dto.setApplicationId(app.getId().toString());
        dto.setUserName(applicant != null ? applicant.getDisplayName() : "");
        dto.setUserEmail(applicant != null ? applicant.getEmail() : "");
        dto.setVideoUrl(m.videoUrl());
        dto.setThumbnailUrl(m.thumbnailUrl());
        dto.setCategory(m.category());
        dto.setViewCount(m.viewCount());
        dto.setLikeCount(m.likeCount());
        dto.setVoteCount(app.getVoteCount());
        dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
        if (score != null) {
            dto.setRecommendedScore(score.getWeightedScore());
            dto.setRecommendedRank(score.getRecommendedRank());
        }
        return dto;
    }

    /**
     * PATCH: API REVIEWING → DB REVIEWING, ACCEPTED/REJECTED 그대로. 합격/불합격 후 비관리자는 변경 불가.
     * (지원 심사 상태는 투표와 별개)
     */
    @Transactional
    public ApplicationStatusPatchDataDto patchApplicationStatus(UUID applicationId, String apiStatus) {
        String dbTarget = toDbStatusFromApi(apiStatus);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        if (!SecurityUtils.hasRole("ADMIN")) {
            String cur = app.getStatus();
            if ("ACCEPTED".equals(cur) || "REJECTED".equals(cur)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료된 지원서는 상태를 변경할 수 없습니다.");
            }
        }

        if (!"REVIEWING".equals(dbTarget) && !"ACCEPTED".equals(dbTarget) && !"REJECTED".equals(dbTarget)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "유효하지 않은 상태입니다.");
        }

        app.setStatus(dbTarget);
        app.setUpdatedAt(java.time.Instant.now());
        app = applicationRepository.save(app);
        applicationScoringService.recalculateForAudition(app.getAuditionId());
        return new ApplicationStatusPatchDataDto(
                app.getId().toString(),
                MeApiMapping.applicationStatusToApi(app.getStatus())
        );
    }

    private static String toDbStatusFromApi(String apiStatus) {
        if ("REVIEWING".equals(apiStatus)) {
            return "REVIEWING";
        }
        return apiStatus;
    }

    @Transactional
    public ApplicationResponse apply(UUID auditionId) {
        UUID applicantId = SecurityUtils.getCurrentUserId();
        if (applicantId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only APPLICANT can apply");
        }
        Audition audition = auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
        if (!"OPEN".equals(audition.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audition is not open for applications");
        }
        if (applicationRepository.existsByAuditionIdAndApplicantId(auditionId, applicantId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already applied to this audition");
        }
        User applicant = userRepository.findById(applicantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));
        Application app = new Application();
        app.setAuditionId(auditionId);
        app.setApplicantId(applicantId);
        app.setStatus("SUBMITTED");
        app.setUpdatedAt(java.time.Instant.now());
        app = applicationRepository.save(app);
        long cnt = applicationRepository.countByAuditionId(auditionId);
        audition.setApplicantsCount((int) cnt);
        auditionRepository.save(audition);
        return toResponse(app, applicant);
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
        if (!SecurityUtils.hasRole("ADMIN")) {
            String cur = app.getStatus();
            if ("ACCEPTED".equals(cur) || "REJECTED".equals(cur)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료된 지원서는 상태를 변경할 수 없습니다.");
            }
        }
        app.setStatus(newStatus);
        app.setUpdatedAt(java.time.Instant.now());
        app = applicationRepository.save(app);
        applicationScoringService.recalculateForAudition(app.getAuditionId());
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
        return response;
    }
}
