package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 댓글 좋아요 Repository
 * 작업: 2026_21_community_features
 */
@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLike.CommentLikeId> {
    
    boolean existsByCommentIdAndUserId(Long commentId, Long userId);
    
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);
    
    long countByCommentId(Long commentId);
}
