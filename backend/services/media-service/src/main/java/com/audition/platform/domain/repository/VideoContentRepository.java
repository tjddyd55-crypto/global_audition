package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.VideoContent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VideoContentRepository extends JpaRepository<VideoContent, Long>, JpaSpecificationExecutor<VideoContent> {

    Page<VideoContent> findByUserId(Long userId, Pageable pageable);

    Page<VideoContent> findByUserIdAndStatus(Long userId, VideoContent.VideoStatus status, Pageable pageable);

    Page<VideoContent> findByStatus(VideoContent.VideoStatus status, Pageable pageable);

    Page<VideoContent> findByCategoryAndStatus(
            VideoContent.VideoCategory category,
            VideoContent.VideoStatus status,
            Pageable pageable
    );

    @Query("SELECT v FROM VideoContent v WHERE v.userId = :userId AND v.status = 'PUBLISHED' ORDER BY v.createdAt DESC")
    List<VideoContent> findPublishedByUserId(@Param("userId") Long userId);

    @Query("SELECT v FROM VideoContent v WHERE v.status = 'PUBLISHED' ORDER BY v.likeCount DESC, v.createdAt DESC")
    Page<VideoContent> findPopularVideos(Pageable pageable);

    // 작업: 2026_12_personal_channel_media - 공개 범위 필터링
    Page<VideoContent> findByUserIdAndStatusAndVisibility(
            Long userId,
            VideoContent.VideoStatus status,
            VideoContent.Visibility visibility,
            Pageable pageable
    );

    Page<VideoContent> findByStatusAndVisibility(
            VideoContent.VideoStatus status,
            VideoContent.Visibility visibility,
            Pageable pageable
    );
    
    // 작업: 2026_15_recommendation_ranking
    List<VideoContent> findByStatusAndVisibility(
            VideoContent.VideoStatus status,
            VideoContent.Visibility visibility,
            Sort sort
    );

    Page<VideoContent> findByUserIdAndVideoTypeAndStatus(
            Long userId,
            VideoContent.VideoType videoType,
            VideoContent.VideoStatus status,
            Pageable pageable
    );
}
