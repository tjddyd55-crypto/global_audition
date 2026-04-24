package com.audition.platform.application.applications;

import com.audition.platform.api.dto.AgencyApplicantsListDto;
import com.audition.platform.api.dto.ApplicationAgencyDetailDto;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.ManageApplicationsPageDataDto;
import com.audition.platform.application.ApplicationService;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLink;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 기획사/관리자 관점의 지원자 관리 유스케이스 경계.
 *
 * <p>지원자 단순 목록과 상세 조회는 이 서비스 경계가 담당한다. 심사 보드 필터링,
 * 레거시 상태 변경 경로는 아직 기존 {@link ApplicationService} 에 위임한다.</p>
 */
@Service
public class AgencyApplicationManageService {

    private final ApplicationService applicationService;
    private final AgencyApplicantsListQueryService agencyApplicantsListQueryService;
    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final UserRepository userRepository;
    private final ApplicantCardMetricsLoader metricsLoader;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;

    public AgencyApplicationManageService(
            ApplicationService applicationService,
            AgencyApplicantsListQueryService agencyApplicantsListQueryService,
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            UserRepository userRepository,
            ApplicantCardMetricsLoader metricsLoader,
            ApplicationSnsLinkRepository applicationSnsLinkRepository) {
        this.applicationService = applicationService;
        this.agencyApplicantsListQueryService = agencyApplicantsListQueryService;
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.userRepository = userRepository;
        this.metricsLoader = metricsLoader;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
    }

    public AgencyApplicantsListDto listAgencyApplicants(UUID auditionId) {
        return agencyApplicantsListQueryService.listAgencyApplicants(auditionId);
    }

    public ManageApplicationsPageDataDto listManageApplications(
            UUID auditionId,
            String category,
            Integer minAge,
            Integer maxAge,
            String nationality,
            Boolean hasSns,
            String boardStatus,
            Integer round) {
        return applicationService.listManageApplications(
                auditionId, category, minAge, maxAge, nationality, hasSns, boardStatus, round);
    }

    public ApplicationAgencyDetailDto getApplicationAgencyDetail(UUID id) {
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        assertAgencyOrAdminCanManageAudition(audition);

        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        var metrics = metricsLoader.resolve(app);
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
        dto.setVideoUrl(metrics.videoUrl());
        dto.setThumbnailUrl(metrics.thumbnailUrl());
        dto.setIntroText(app.getIntroText());
        dto.setStatus(MeApiMapping.agencyBoardStatusToApi(app.getStatus()));
        dto.setRound(app.getCurrentRoundNumber());
        dto.setCreatedAt(app.getCreatedAt() != null ? app.getCreatedAt().toString() : null);

        List<ApplicationSnsLink> links = applicationSnsLinkRepository.findByApplicationIdOrderByCreatedAtAsc(id);
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

    public ApplicationResponse decide(UUID id, String status) {
        return applicationService.decide(id, status);
    }

    public ApplicationResponse markReviewed(UUID id) {
        return applicationService.markReviewed(id);
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
}
