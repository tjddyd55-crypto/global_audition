package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.VideoComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 영상 댓글 Repository
 * 작업: 2026_21_community_features
 */
@Repository
public interface VideoCommentRepository extends JpaRepository<VideoComment, Long> {
    
    Page<VideoComment> findByVideoIdAndParentCommentIsNull(Long videoId, Pageable pageable);
    
    List<VideoComment> findByParentCommentId(Long parentCommentId);
    
    @Query("SELECT c FROM VideoComment c WHERE c.video.id = :videoId AND c.deletedAt IS NULL ORDER BY c.createdAt DESC")
    Page<VideoComment> findActiveCommentsByVideoId(@Param("videoId") Long videoId, Pageable pageable);
}
