package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.FollowRequest;
import com.audition.platform.application.service.FollowService;
import com.audition.platform.domain.entity.UserFollow;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 팔로우/구독 컨트롤러
 * 작업: 2026_16_follow_subscription
 */
@RestController
@RequestMapping("/api/v1/follows")
@RequiredArgsConstructor
@Tag(name = "Follows & Subscriptions", description = "팔로우/구독 API")
public class FollowController {

    private final FollowService followService;
    private final AuthHeaderUserResolver authHeaderUserResolver;

    @PostMapping
    @Operation(summary = "팔로우/구독", description = "개인 채널 또는 기획사 팔로우")
    public ResponseEntity<Void> follow(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid FollowRequest request
    ) {
        Long followerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        followService.follow(followerId, request.getFollowingId(), request.getFollowType());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{followingId}")
    @Operation(summary = "언팔로우/구독 취소")
    public ResponseEntity<Void> unfollow(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long followingId,
            @RequestParam UserFollow.FollowType followType
    ) {
        Long followerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        followService.unfollow(followerId, followingId, followType);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{followingId}")
    @Operation(summary = "팔로우 여부 확인")
    public ResponseEntity<Boolean> isFollowing(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long followingId,
            @RequestParam UserFollow.FollowType followType
    ) {
        Long followerId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        boolean isFollowing = followService.isFollowing(followerId, followingId, followType);
        return ResponseEntity.ok(isFollowing);
    }

    @GetMapping("/followers/{userId}")
    @Operation(summary = "팔로워 목록 조회", description = "특정 사용자를 팔로우하는 사용자 목록")
    public ResponseEntity<Page<Long>> getFollowers(
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<Long> followers = followService.getFollowers(userId, pageable);
        return ResponseEntity.ok(followers);
    }

    @GetMapping("/following/{userId}")
    @Operation(summary = "팔로잉 목록 조회", description = "특정 사용자가 팔로우하는 사용자 목록")
    public ResponseEntity<Page<Long>> getFollowing(
            @PathVariable Long userId,
            @RequestParam(required = false) UserFollow.FollowType followType,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<Long> following;
        if (followType != null) {
            following = followService.getFollowingByType(userId, followType, pageable);
        } else {
            following = followService.getFollowing(userId, pageable);
        }
        return ResponseEntity.ok(following);
    }

    @GetMapping("/count/{userId}")
    @Operation(summary = "팔로워/팔로잉 수 조회")
    public ResponseEntity<FollowCountDto> getFollowCount(@PathVariable Long userId) {
        long followerCount = followService.getFollowerCount(userId);
        long followingCount = followService.getFollowingCount(userId);
        return ResponseEntity.ok(new FollowCountDto(followerCount, followingCount));
    }

    // DTO 클래스
    public static class FollowCountDto {
        private long followerCount;
        private long followingCount;

        public FollowCountDto(long followerCount, long followingCount) {
            this.followerCount = followerCount;
            this.followingCount = followingCount;
        }

        public long getFollowerCount() {
            return followerCount;
        }

        public long getFollowingCount() {
            return followingCount;
        }
    }
}
