package com.audition.platform.application.publicmedia;

import com.audition.platform.api.dto.LikeToggleResultDto;
import com.audition.platform.domain.audition.Application;
import com.audition.platform.domain.audition.ApplicationRepository;
import com.audition.platform.domain.audition.ApplicationVideo;
import com.audition.platform.domain.audition.ApplicationVideoRepository;
import com.audition.platform.domain.like.ApplicationLike;
import com.audition.platform.domain.like.ApplicationLikeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationLikeService {

    private static final List<String> LISTABLE_STATUSES = List.of("SUBMITTED", "REVIEWING", "ACCEPTED");

    private final ApplicationRepository applicationRepository;
    private final ApplicationVideoRepository applicationVideoRepository;
    private final ApplicationLikeRepository applicationLikeRepository;

    public ApplicationLikeService(
            ApplicationRepository applicationRepository,
            ApplicationVideoRepository applicationVideoRepository,
            ApplicationLikeRepository applicationLikeRepository) {
        this.applicationRepository = applicationRepository;
        this.applicationVideoRepository = applicationVideoRepository;
        this.applicationLikeRepository = applicationLikeRepository;
    }

    @Transactional
    public LikeToggleResultDto addLike(UUID userId, UUID applicationId) {
        assertListable(applicationId);
        if (applicationLikeRepository.existsByApplicationIdAndUserId(applicationId, userId)) {
            return snapshot(applicationId, true);
        }
        ApplicationVideo video = representativeVideoOrNotFound(applicationId);
        ApplicationLike row = new ApplicationLike();
        row.setApplicationId(applicationId);
        row.setUserId(userId);
        applicationLikeRepository.save(row);
        video.setLikeCount(video.getLikeCount() + 1);
        applicationVideoRepository.save(video);
        return new LikeToggleResultDto(video.getLikeCount(), true);
    }

    @Transactional
    public LikeToggleResultDto removeLike(UUID userId, UUID applicationId) {
        assertListable(applicationId);
        applicationLikeRepository.findByApplicationIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "좋아요를 찾을 수 없습니다."));
        applicationLikeRepository.deleteByApplicationIdAndUserId(applicationId, userId);
        ApplicationVideo video = representativeVideoOrNotFound(applicationId);
        long next = Math.max(0, video.getLikeCount() - 1);
        video.setLikeCount(next);
        applicationVideoRepository.save(video);
        return new LikeToggleResultDto(next, false);
    }

    private void assertListable(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원을 찾을 수 없습니다."));
        if (!LISTABLE_STATUSES.contains(app.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공개되지 않은 지원입니다.");
        }
    }

    private ApplicationVideo representativeVideoOrNotFound(UUID applicationId) {
        return applicationVideoRepository.findFirstByApplicationIdOrderByCreatedAtDesc(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "대표 영상이 없습니다."));
    }

    private LikeToggleResultDto snapshot(UUID applicationId, boolean liked) {
        ApplicationVideo video = representativeVideoOrNotFound(applicationId);
        return new LikeToggleResultDto(video.getLikeCount(), liked);
    }
}
