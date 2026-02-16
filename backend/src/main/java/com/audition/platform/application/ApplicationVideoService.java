package com.audition.platform.application;

import com.audition.platform.api.dto.ApplicationVideoResponse;
import com.audition.platform.api.dto.CreateApplicationVideoRequest;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ApplicationVideoService {
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;

    public ApplicationVideoService(ApplicationVideoRepository applicationVideoRepository,
                                   ApplicationRepository applicationRepository,
                                   AuditionRepository auditionRepository) {
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
    }

    private static ApplicationVideoResponse toResponse(ApplicationVideo video) {
        ApplicationVideoResponse response = new ApplicationVideoResponse();
        response.setId(video.getId());
        response.setApplicationId(video.getApplicationId());
        response.setVideoUrl(video.getVideoUrl());
        response.setCreatedAt(video.getCreatedAt());
        return response;
    }

    private Application getApplication(UUID applicationId) {
        return applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    private Audition getAudition(UUID auditionId) {
        return auditionRepository.findById(auditionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audition not found"));
    }

    @Transactional
    public ApplicationVideoResponse create(UUID applicationId, CreateApplicationVideoRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!SecurityUtils.hasRole("APPLICANT")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only APPLICANT can add videos");
        }

        Application application = getApplication(applicationId);
        if (!application.getApplicantId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only application owner can add videos");
        }

        ApplicationVideo video = new ApplicationVideo();
        video.setApplicationId(applicationId);
        video.setVideoUrl(request.getVideoUrl().trim());
        return toResponse(applicationVideoRepository.save(video));
    }

    public List<ApplicationVideoResponse> list(UUID applicationId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        Application application = getApplication(applicationId);
        Audition audition = getAudition(application.getAuditionId());
        boolean isApplicant = application.getApplicantId().equals(userId);
        boolean isOwner = audition.getOwnerId().equals(userId);
        boolean isAdmin = SecurityUtils.hasRole("ADMIN");
        if (!isApplicant && !isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access videos");
        }

        return applicationVideoRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).stream()
                .map(ApplicationVideoService::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(UUID videoId) {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        ApplicationVideo video = applicationVideoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
        Application application = getApplication(video.getApplicationId());
        if (!application.getApplicantId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only applicant owner can delete video");
        }
        applicationVideoRepository.delete(video);
    }
}
