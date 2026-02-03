package com.audition.platform.application.service;

import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.entity.UserFollow;
import com.audition.platform.domain.repository.UserFollowRepository;
import com.audition.platform.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 팔로우/구독 서비스
 * 작업: 2026_16_follow_subscription
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;

    /**
     * 팔로우/구독
     */
    public void follow(Long followerId, Long followingId, UserFollow.FollowType followType) {
        // 자기 자신 팔로우 방지
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("자기 자신을 팔로우할 수 없습니다");
        }

        // 대상 사용자 존재 확인
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("팔로우 대상 사용자를 찾을 수 없습니다: " + followingId));

        // 이미 팔로우 중인지 확인
        if (userFollowRepository.existsByFollowerIdAndFollowingIdAndFollowType(followerId, followingId, followType)) {
            throw new RuntimeException("이미 팔로우 중입니다");
        }

        UserFollow follow = UserFollow.builder()
                .followerId(followerId)
                .followingId(followingId)
                .followType(followType)
                .build();

        userFollowRepository.save(follow);
        log.info("팔로우 완료: followerId={}, followingId={}, type={}", followerId, followingId, followType);
    }

    /**
     * 언팔로우/구독 취소
     */
    public void unfollow(Long followerId, Long followingId, UserFollow.FollowType followType) {
        UserFollow follow = userFollowRepository.findByFollowerIdAndFollowingIdAndFollowType(
                followerId, followingId, followType)
                .orElseThrow(() -> new RuntimeException("팔로우 관계를 찾을 수 없습니다"));

        userFollowRepository.delete(follow);
        log.info("언팔로우 완료: followerId={}, followingId={}, type={}", followerId, followingId, followType);
    }

    /**
     * 팔로우 여부 확인
     */
    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followingId, UserFollow.FollowType followType) {
        return userFollowRepository.existsByFollowerIdAndFollowingIdAndFollowType(
                followerId, followingId, followType);
    }

    /**
     * 팔로워 목록 조회 (나를 팔로우하는 사용자)
     */
    @Transactional(readOnly = true)
    public Page<Long> getFollowers(Long userId, Pageable pageable) {
        Page<UserFollow> follows = userFollowRepository.findByFollowingId(userId, pageable);
        return follows.map(UserFollow::getFollowerId)
                .map(followerId -> {
                    // Long 변환
                    return followerId;
                });
    }

    /**
     * 팔로잉 목록 조회 (내가 팔로우하는 사용자)
     */
    @Transactional(readOnly = true)
    public Page<Long> getFollowing(Long userId, Pageable pageable) {
        Page<UserFollow> follows = userFollowRepository.findByFollowerId(userId, pageable);
        return follows.map(UserFollow::getFollowingId);
    }

    /**
     * 팔로워 수 조회
     */
    @Transactional(readOnly = true)
    public long getFollowerCount(Long userId) {
        return userFollowRepository.countByFollowingId(userId);
    }

    /**
     * 팔로잉 수 조회
     */
    @Transactional(readOnly = true)
    public long getFollowingCount(Long userId) {
        return userFollowRepository.countByFollowerId(userId);
    }

    /**
     * 타입별 팔로잉 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<Long> getFollowingByType(Long userId, UserFollow.FollowType followType, Pageable pageable) {
        Page<UserFollow> follows = userFollowRepository.findByFollowerIdAndFollowType(userId, followType, pageable);
        return follows.map(UserFollow::getFollowingId);
    }
}
