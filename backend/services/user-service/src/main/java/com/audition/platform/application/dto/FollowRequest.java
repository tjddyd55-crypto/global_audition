package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.UserFollow;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 팔로우 요청
 * 작업: 2026_16_follow_subscription
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowRequest {
    @NotNull(message = "팔로우 대상 사용자 ID는 필수입니다")
    private Long followingId;

    @NotNull(message = "팔로우 타입은 필수입니다")
    private UserFollow.FollowType followType; // CHANNEL, AGENCY
}
