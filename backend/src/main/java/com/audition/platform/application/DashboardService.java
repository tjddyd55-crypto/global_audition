package com.audition.platform.application;

import com.audition.platform.api.dto.AgencyDashboardResponse;
import com.audition.platform.api.dto.ApplicantDashboardResponse;
import com.audition.platform.api.dto.ApplicationResponse;
import com.audition.platform.api.dto.AuditionResponse;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
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
public class DashboardService {
    private final AuditionRepository auditionRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final UserRepository userRepository;

    public DashboardService(AuditionRepository auditionRepository,
                            ApplicationRepository applicationRepository,
                            ApplicationVideoRepository applicationVideoRepository,
                            UserRepository userRepository) {
        this.auditionRepository = auditionRepository;
        this.applicationRepository = applicationRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.userRepository = userRepository;
    }

    private static AuditionResponse toAuditionResponse(Audition a) {
        AuditionResponse r = new AuditionResponse();
        r.setId(a.getId());
        r.setOwnerId(a.getOwnerId());
        r.setTitle(a.getTitle());
        r.setDescription(a.getDescription());
        r.setStatus(a.getStatus());
        r.setUpdatedAt(a.getUpdatedAt());
        r.setCountryCode(a.getCountryCode());
        r.setDeadlineAt(a.getDeadlineAt());
        r.setCategory(a.getCategory());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }

    private ApplicationResponse toApplicationResponse(Application app, Map<UUID, Audition> auditionMap) {
        ApplicationResponse response = new ApplicationResponse();
        response.setId(app.getId());
        response.setAuditionId(app.getAuditionId());
        response.setApplicantId(app.getApplicantId());
        response.setStatus(app.getStatus());
        response.setMessage(app.getMessage());
        response.setUpdatedAt(app.getUpdatedAt());
        response.setCreatedAt(app.getCreatedAt());

        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        response.setApplicantEmail(applicant != null ? applicant.getEmail() : null);
        Audition audition = auditionMap.get(app.getAuditionId());
        response.setAuditionTitle(audition != null ? audition.getTitle() : null);
        return response;
    }

    public AgencyDashboardResponse getAgencyDashboard() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("AGENCY") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only AGENCY or ADMIN can view this dashboard");
        }

        List<Audition> ownedAuditions;
        if (SecurityUtils.hasRole("ADMIN")) {
            ownedAuditions = auditionRepository.findAllByOrderByCreatedAtDesc();
        } else {
            ownedAuditions = auditionRepository.findByOwnerIdOrderByCreatedAtDesc(userId);
        }
        List<UUID> auditionIds = ownedAuditions.stream().map(Audition::getId).collect(Collectors.toList());

        long totalApplications = auditionIds.isEmpty() ? 0 : applicationRepository.countByAuditionIdIn(auditionIds);
        long accepted = auditionIds.isEmpty() ? 0 : applicationRepository.countByStatusAndAuditionIdIn("ACCEPTED", auditionIds);
        long rejected = auditionIds.isEmpty() ? 0 : applicationRepository.countByStatusAndAuditionIdIn("REJECTED", auditionIds);
        long reviewed = auditionIds.isEmpty() ? 0 : applicationRepository.countByStatusAndAuditionIdIn("REVIEWED", auditionIds);
        long submitted = auditionIds.isEmpty() ? 0 : applicationRepository.countByStatusAndAuditionIdIn("SUBMITTED", auditionIds);

        List<Application> recentApplications = auditionIds.isEmpty()
                ? Collections.emptyList()
                : applicationRepository.findTop10ByAuditionIdInOrderByCreatedAtDesc(auditionIds);

        Map<UUID, Audition> auditionMap = ownedAuditions.stream()
                .collect(Collectors.toMap(Audition::getId, a -> a, (a, b) -> a));

        AgencyDashboardResponse response = new AgencyDashboardResponse();
        response.setTotalAuditions(ownedAuditions.size());
        response.setOpenAuditions(ownedAuditions.stream().filter(a -> "OPEN".equals(a.getStatus())).count());
        response.setTotalApplications(totalApplications);
        response.setAccepted(accepted);
        response.setRejected(rejected);
        response.setPending(reviewed + submitted);
        response.setRecentAuditions(ownedAuditions.stream().limit(5).map(DashboardService::toAuditionResponse).collect(Collectors.toList()));
        response.setRecentApplications(recentApplications.stream().map(app -> toApplicationResponse(app, auditionMap)).collect(Collectors.toList()));
        return response;
    }

    public ApplicantDashboardResponse getApplicantDashboard() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only APPLICANT can view this dashboard");
        }

        List<Application> recentApplications = applicationRepository.findTop10ByApplicantIdOrderByCreatedAtDesc(userId);
        List<UUID> applicationIds = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(userId).stream()
                .map(Application::getId)
                .collect(Collectors.toList());
        long videosCount = 0;
        if (!applicationIds.isEmpty()) {
            for (UUID applicationId : applicationIds) {
                videosCount += applicationVideoRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).size();
            }
        }

        List<UUID> auditionIds = recentApplications.stream().map(Application::getAuditionId).distinct().collect(Collectors.toList());
        Map<UUID, Audition> auditionMap = auditionIds.isEmpty()
                ? Collections.emptyMap()
                : auditionRepository.findAllById(auditionIds).stream().collect(Collectors.toMap(Audition::getId, a -> a));

        ApplicantDashboardResponse response = new ApplicantDashboardResponse();
        response.setApplied(applicationRepository.countByApplicantId(userId));
        response.setReviewed(applicationRepository.countByApplicantIdAndStatus(userId, "REVIEWED"));
        response.setAccepted(applicationRepository.countByApplicantIdAndStatus(userId, "ACCEPTED"));
        response.setRejected(applicationRepository.countByApplicantIdAndStatus(userId, "REJECTED"));
        response.setVideosCount(videosCount);
        response.setRecentApplications(recentApplications.stream().map(app -> toApplicationResponse(app, auditionMap)).collect(Collectors.toList()));
        return response;
    }
}
