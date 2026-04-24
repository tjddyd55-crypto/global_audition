package com.audition.platform.application.applications;

import com.audition.platform.application.ranking.ApplicationRankingService;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.audition.Audition;
import com.audition.platform.domain.audition.AuditionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * 지원 영상 조회수 증가 유스케이스.
 *
 * <p>공개 투표 화면에서 대표 영상(application_videos 최신 1건) 조회수 +1.
 * application_videos 행이 없으면 무시하고, 오디션이 OPEN일 때만 반영한다.</p>
 */
@Service
public class ApplicationVideoViewService {

    private final ApplicationRepository applicationRepository;
    private final AuditionRepository auditionRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationRankingService applicationRankingService;

    public ApplicationVideoViewService(
            ApplicationRepository applicationRepository,
            AuditionRepository auditionRepository,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationRankingService applicationRankingService) {
        this.applicationRepository = applicationRepository;
        this.auditionRepository = auditionRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationRankingService = applicationRankingService;
    }

    @Transactional
    public void incrementRepresentativeVideoView(UUID id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        Audition audition = auditionRepository.findById(app.getAuditionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "오디션을 찾을 수 없습니다."));
        if (!"OPEN".equals(audition.getStatus())) {
            return;
        }
        Optional<ApplicationVideo> videoOpt =
                applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(id);
        if (videoOpt.isEmpty()) {
            return;
        }
        ApplicationVideo video = videoOpt.get();
        video.setViewCount(video.getViewCount() + 1);
        video.setUpdatedAt(Instant.now());
        applicationVideoRepository.save(video);
        applicationRankingService.recalculateScores(app.getAuditionId());
    }
}
