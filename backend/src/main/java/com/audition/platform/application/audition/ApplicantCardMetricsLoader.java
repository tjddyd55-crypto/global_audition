package com.audition.platform.application.audition;

import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.channel.ChannelVideo;
import com.audition.platform.domain.channel.ChannelVideoRepository;
import com.audition.platform.infra.YoutubeThumbnailUtil;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 지원 카드 공통 메트릭: application_videos 우선, 부족 시 채널 영상 보강.
 */
@Component
public class ApplicantCardMetricsLoader {

    private final ApplicationVideoRepository applicationVideoRepository;
    private final ChannelVideoRepository channelVideoRepository;

    public ApplicantCardMetricsLoader(
            ApplicationVideoRepository applicationVideoRepository,
            ChannelVideoRepository channelVideoRepository) {
        this.applicationVideoRepository = applicationVideoRepository;
        this.channelVideoRepository = channelVideoRepository;
    }

    public ApplicantCardMetrics resolve(Application app) {
        Optional<ApplicationVideo> avOpt =
                applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(app.getId());
        String videoUrl = "";
        String thumbnailUrl = null;
        String category = "";
        long viewCount = 0;
        long likeCount = 0;

        if (avOpt.isPresent()) {
            ApplicationVideo av = avOpt.get();
            videoUrl = av.getVideoUrl() != null ? av.getVideoUrl() : "";
            thumbnailUrl = av.getThumbnailUrl();
            category = av.getCategory() != null ? av.getCategory().trim() : "";
            viewCount = av.getViewCount();
            likeCount = av.getLikeCount();
        }

        Optional<ChannelVideo> chOpt = channelVideoRepository.findFirstByOwnerIdOrderByUpdatedAtDesc(app.getApplicantId());
        if (chOpt.isPresent()) {
            ChannelVideo cv = chOpt.get();
            if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
                thumbnailUrl = cv.getThumbnailUrl();
            }
            if (category.isBlank() && cv.getCategory() != null && !cv.getCategory().isBlank()) {
                category = cv.getCategory().trim();
            }
            if (viewCount == 0) {
                viewCount = cv.getViewCount();
            }
            if (likeCount == 0) {
                likeCount = cv.getLikeCount();
            }
        }

        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = YoutubeThumbnailUtil.hqThumbnail(videoUrl).orElse(null);
        }

        return new ApplicantCardMetrics(videoUrl, thumbnailUrl, category, viewCount, likeCount);
    }

    public record ApplicantCardMetrics(
            String videoUrl,
            String thumbnailUrl,
            String category,
            long viewCount,
            long likeCount
    ) {
    }
}
