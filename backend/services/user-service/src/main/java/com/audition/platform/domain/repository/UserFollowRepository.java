package com.audition.platform.domain.repository;

import com.audition.platform.domain.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 팔로우 Repository
 * 작업: 2026_16_follow_subscription
 */
@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    
    Optional<UserFollow> findByFollowerIdAndFollowingIdAndFollowType(
            Long followerId, Long followingId, UserFollow.FollowType followType);
    
    boolean existsByFollowerIdAndFollowingIdAndFollowType(
            Long followerId, Long followingId, UserFollow.FollowType followType);
    
    Page<UserFollow> findByFollowerId(Long followerId, Pageable pageable);
    
    Page<UserFollow> findByFollowingId(Long followingId, Pageable pageable);
    
    Page<UserFollow> findByFollowerIdAndFollowType(Long followerId, UserFollow.FollowType followType, Pageable pageable);
    
    Page<UserFollow> findByFollowingIdAndFollowType(Long followingId, UserFollow.FollowType followType, Pageable pageable);
    
    long countByFollowingId(Long followingId);
    
    long countByFollowerId(Long followerId);
}
