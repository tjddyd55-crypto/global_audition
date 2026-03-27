package com.audition.platform.application.me;

import com.audition.platform.api.dto.AuditionRoundSummaryDto;
import com.audition.platform.api.dto.me.*;
import com.audition.platform.application.round.AuditionProcessModes;
import com.audition.platform.application.round.AuditionRoundService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationSnsLink;
import com.audition.platform.domain.audition.ApplicationSnsLinkRepository;
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
public class MeApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationSnsLinkRepository applicationSnsLinkRepository;
    private final AuditionRepository auditionRepository;
    private final AuditionRoundService auditionRoundService;

    public MeApplicationService(
            ApplicationRepository applicationRepository,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationSnsLinkRepository applicationSnsLinkRepository,
            AuditionRepository auditionRepository,
            AuditionRoundService auditionRoundService) {
        this.applicationRepository = applicationRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationSnsLinkRepository = applicationSnsLinkRepository;
        this.auditionRepository = auditionRepository;
        this.auditionRoundService = auditionRoundService;
    }

    private UUID requireApplicant() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("APPLICANT") && !SecurityUtils.hasRole("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "지원자만 이용할 수 있습니다.");
        }
        return userId;
    }

    private Application requireOwnedApplication(UUID applicationId, UUID applicantId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 지원서를 찾을 수 없습니다."));
        if (!app.getApplicantId().equals(applicantId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 지원서를 찾을 수 없습니다.");
        }
        return app;
    }

    private void assertCanEditVideos(Application app) {
        String s = app.getStatus();
        if ("ACCEPTED".equals(s) || "REJECTED".equals(s)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검토 완료된 지원서는 영상을 수정할 수 없습니다.");
        }
    }

    public MyApplicationsPageDto listApplications() {
        UUID userId = requireApplicant();
        List<Application> all = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(userId);
        List<MyApplicationListItemDto> items = all.stream().map(app -> {
            MyApplicationListItemDto dto = new MyApplicationListItemDto();
            dto.setApplicationId(app.getId().toString());
            dto.setAuditionId(app.getAuditionId().toString());
            dto.setAuditionTitle(auditionRepository.findById(app.getAuditionId()).map(Audition::getTitle).orElse(""));
            dto.setAppliedAt(app.getCreatedAt());
            dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
            return dto;
        }).collect(Collectors.toList());
        MyApplicationsPageDto page = new MyApplicationsPageDto();
        page.setItems(items);
        page.setTotal(items.size());
        return page;
    }

    public MyApplicationDetailDto getApplication(UUID applicationId) {
        UUID userId = requireApplicant();
        Application app = requireOwnedApplication(applicationId, userId);
        return toDetail(app);
    }

    private MyApplicationDetailDto toDetail(Application app) {
        Audition audition = auditionRepository.findById(app.getAuditionId()).orElse(null);
        MyApplicationDetailDto dto = new MyApplicationDetailDto();
        dto.setApplicationId(app.getId().toString());
        dto.setAuditionId(app.getAuditionId().toString());
        dto.setAuditionTitle(audition != null ? audition.getTitle() : "");
        dto.setAppliedAt(app.getCreatedAt());
        dto.setStatus(MeApiMapping.applicationStatusToApi(app.getStatus()));
        dto.setCurrentRoundNumber(app.getCurrentRoundNumber());
        if (audition != null) {
            dto.setProcessMode(audition.getProcessMode() != null ? audition.getProcessMode() : "SINGLE");
            if (AuditionProcessModes.isMultiRound(audition.getProcessMode())) {
                dto.setRoundSummaries(auditionRoundService.listRounds(app.getAuditionId()).stream()
                        .map(x -> new AuditionRoundSummaryDto(x.getId().toString(), x.getRoundNumber()))
                        .collect(Collectors.toList()));
            }
        }
        dto.setName(app.getApplicantName());
        if (app.getBirthDate() != null) {
            dto.setBirthDate(app.getBirthDate().toString());
        }
        dto.setAge(app.getAge());
        dto.setNationality(app.getNationality());
        dto.setIntroText(app.getIntroText());

        List<ApplicationVideo> videos = applicationVideoRepository.findByApplicationIdOrderByCreatedAtDesc(app.getId());
        dto.setVideos(videos.stream().map(this::toVideoDto).collect(Collectors.toList()));
        if (!videos.isEmpty()) {
            dto.setVideoUrl(videos.get(0).getVideoUrl());
        } else if (app.getVideoUrl() != null && !app.getVideoUrl().isBlank()) {
            dto.setVideoUrl(app.getVideoUrl().trim());
        }

        List<ApplicationSnsLink> snsLinks = applicationSnsLinkRepository.findByApplicationIdOrderByCreatedAtAsc(app.getId());
        dto.setSnsLinks(snsLinks.stream().map(link -> {
            MeSnsLinkDto row = new MeSnsLinkDto();
            row.setPlatform(link.getPlatform());
            row.setUrl(link.getUrl());
            return row;
        }).collect(Collectors.toList()));
        return dto;
    }

    private ApplicationVideoDto toVideoDto(ApplicationVideo v) {
        ApplicationVideoDto dto = new ApplicationVideoDto();
        dto.setVideoId(v.getId().toString());
        dto.setTitle(v.getTitle() != null ? v.getTitle() : "Audition Video");
        dto.setVideoUrl(v.getVideoUrl());
        dto.setThumbnailUrl(v.getThumbnailUrl());
        return dto;
    }

    @Transactional
    public ApplicationVideoDto addVideo(UUID applicationId, CreateMeApplicationVideoRequest req) {
        UUID userId = requireApplicant();
        Application app = requireOwnedApplication(applicationId, userId);
        assertCanEditVideos(app);
        ApplicationVideo video = new ApplicationVideo();
        video.setApplicationId(applicationId);
        video.setVideoUrl(req.getVideoUrl().trim());
        String title = req.getTitle();
        video.setTitle(title != null && !title.isBlank() ? title.trim() : "Audition Video");
        video = applicationVideoRepository.save(video);
        return toVideoDto(video);
    }

    @Transactional
    public boolean deleteVideo(UUID applicationId, UUID videoId) {
        UUID userId = requireApplicant();
        Application app = requireOwnedApplication(applicationId, userId);
        assertCanEditVideos(app);
        ApplicationVideo video = applicationVideoRepository.findByIdAndApplicationId(videoId, applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "영상을 찾을 수 없습니다."));
        applicationVideoRepository.delete(video);
        return true;
    }
}
