package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.VideoFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 영상 피드백 Repository
 * 작업: 2026_13_video_feedback
 */
@Repository
public interface VideoFeedbackRepository extends JpaRepository<VideoFeedback, Long> {
    
    Page<VideoFeedback> findByVideoId(Long videoId, Pageable pageable);
    
    List<VideoFeedback> findByVideoIdOrderByTimestampSecondsAsc(Long videoId);
    
    Page<VideoFeedback> findByUserId(Long userId, Pageable pageable);
    
    @Query("SELECT vf FROM VideoFeedback vf WHERE vf.video.id = :videoId AND vf.timestampSeconds BETWEEN :startTime AND :endTime ORDER BY vf.timestampSeconds ASC")
    List<VideoFeedback> findByVideoIdAndTimeRange(
            @Param("videoId") Long videoId,
            @Param("startTime") Integer startTime,
            @Param("endTime") Integer endTime
    );

    // 작업: 2026_15_recommendation_ranking
    long countByVideoId(Long videoId);
}
