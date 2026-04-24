package com.audition.platform.application;

import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationAgencyDetailDto;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ApplicationSnsLinkItem;
import com.audition.platform.api.dto.ApplicationStatusPatchDataDto;
import com.audition.platform.api.dto.ApplicationVideoItem;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.api.dto.CreateApplicationRequest;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicationRankingService applicationRankingService;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final ApplicationStatusHistoryRepository applicationStatusHistoryRepository;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicationRankingService applicationRankingService,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            ApplicationStatusHistoryRepository applicationStatusHistoryRepository) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.applicationRankingService = applicationRankingService;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.applicationStatusHistoryRepository = applicationStatusHistoryRepository;
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
    @Deprecated
    public AgencyApplicantsListDto listAgencyApplicants(UUID auditionId) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "기획사 지원자 단순 목록 조회는 AgencyApplicantsListQueryService를 사용하세요.");
    }

    /**
     * 기획사 지원자 관리 화면 (통계·카테고리·추천 점수 포함).
     * 보드 필터: minAge, maxAge, nationality, hasSns, boardStatus(PENDING|REVIEWING|APPROVED|REJECTED)
     * @param roundFilter {@code null} 또는 1 미만이면 전체, 그렇지 않으면 {@code applications.current_round_number} 일치만
     */
    @Deprecated
    public ManageApplicationsPageDataDto listManageApplications(
            UUID auditionId,
            String categoryFilter,
            Integer minAge,
            Integer maxAge,
            String nationalityFilter,
            Boolean hasSns,
            String boardStatus,
            Integer roundFilter) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "기획사 지원자 관리 보드 조회는 ManageApplicationsQueryService를 사용하세요.");
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

    @Deprecated
    public ApplicationAgencyDetailDto getApplicationAgencyDetail(UUID applicationId) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "기획사 지원자 상세 조회는 AgencyApplicationManageService를 사용하세요.");
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
