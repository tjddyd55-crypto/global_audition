package com.audition.platform.application.publicmedia;

import com.audition.platform.api.dto.ApplicationPublicVideoDto;
import com.audition.platform.api.dto.ApplicationRecommendItemDto;
import com.audition.platform.application.audition.ApplicantCardMetricsLoader;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.like.ApplicationLikeRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.vote.VoteRepository;
import com.audition.platform.infra.SecurityUtils;
import com.audition.platform.infra.YoutubeThumbnailUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ApplicationPublicVideoService {

    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");
    private static final int SIDEBAR_CAP = 20;

    private final ApplicationRepository applicationRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final UserRepository userRepository;
    private final ApplicationLikeRepository applicationLikeRepository;
    private final VoteRepository voteRepository;
    private final ApplicantCardMetricsLoader metricsLoader;

    public ApplicationPublicVideoService(
            ApplicationRepository applicationRepository,
            ApplicationVideoRepository applicationVideoRepository,
            UserRepository userRepository,
            ApplicationLikeRepository applicationLikeRepository,
            VoteRepository voteRepository,
            ApplicantCardMetricsLoader metricsLoader) {
        this.applicationRepository = applicationRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.userRepository = userRepository;
        this.applicationLikeRepository = applicationLikeRepository;
        this.voteRepository = voteRepository;
        this.metricsLoader = metricsLoader;
    }

    public ApplicationPublicVideoDto getPublicDetail(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        if (!LISTABLE_STATUSES.contains(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공개되지 않은 지원입니다.");
        }
        ApplicationVideo video = applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "대표 영상이 없습니다."));

        User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
        UUID viewerId = SecurityUtils.getCurrentUserId();

        boolean liked = viewerId != null
                && applicationLikeRepository.existsByApplicationIdAndUserId(applicationId, viewerId);
        boolean voted = false;
        if (viewerId != null) {
            Optional<UUID> votedApp = voteRepository.findByAuditionIdAndUserId(app.getAuditionId(), viewerId)
                    .map(v -> v.getApplicationId());
            voted = votedApp.map(id -> id.equals(applicationId)).orElse(false);
        }

        String thumb = video.getThumbnailUrl();
        if (thumb == null || thumb.isBlank()) {
            thumb = YoutubeThumbnailUtil.hqThumbnail(video.getVideoUrl()).orElse(null);
        }

        ApplicationPublicVideoDto dto = new ApplicationPublicVideoDto();
        dto.setApplicationId(app.getId().toString());
        dto.setAuditionId(app.getAuditionId().toString());
        dto.setTitle(video.getTitle() != null ? video.getTitle() : "");
        dto.setVideoUrl(video.getVideoUrl() != null ? video.getVideoUrl() : "");
        dto.setThumbnailUrl(thumb);
        dto.setCategory(video.getCategory() != null ? video.getCategory() : "");
        dto.setViewCount(video.getViewCount());
        dto.setLikeCount(video.getLikeCount());
        dto.setLiked(liked);
        dto.setVoted(voted);
        dto.setDescription(app.getMessage() != null ? app.getMessage() : "");
        dto.setChannelDisplayName(applicant != null ? applicant.getDisplayName() : "");
        dto.setChannelProfileImageUrl(applicant != null ? applicant.getProfileImageUrl() : null);
        dto.setSubscriberCount(0L);
        dto.setPublishedAt(video.getCreatedAt() != null ? video.getCreatedAt() : app.getCreatedAt());
        return dto;
    }

    public List<ApplicationRecommendItemDto> listRecommendations(UUID excludeApplicationId) {
        List<Application> rows = applicationRepository.findTop50ByStatusInOrderByCreatedAtDesc(LISTABLE_STATUSES);
        List<ApplicationRecommendItemDto> out = new ArrayList<>();
        for (Application app : rows) {
            if (excludeApplicationId != null && app.getId().equals(excludeApplicationId)) {
                continue;
            }
            if (out.size() >= SIDEBAR_CAP) {
                break;
            }
            ApplicationVideo video = applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId())
                    .orElse(null);
            if (video == null) {
                continue;
            }
            var m = metricsLoader.resolve(app);
            User applicant = userRepository.findById(app.getApplicantId()).orElse(null);
            String thumb = m.thumbnailUrl();
            if (thumb == null || thumb.isBlank()) {
                thumb = YoutubeThumbnailUtil.hqThumbnail(m.videoUrl()).orElse(null);
            }
            ApplicationRecommendItemDto item = new ApplicationRecommendItemDto();
            item.setApplicationId(app.getId().toString());
            item.setTitle(video.getTitle() != null ? video.getTitle() : "");
            item.setThumbnailUrl(thumb);
            item.setChannelDisplayName(applicant != null ? applicant.getDisplayName() : "");
            item.setViewCount(m.viewCount());
            item.setPublishedAt(video.getCreatedAt() != null ? video.getCreatedAt() : app.getCreatedAt());
            out.add(item);
        }
        return out;
    }
}
