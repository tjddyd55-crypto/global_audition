package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 사용자 팔로우/구독 엔티티
 * 작업: 2026_16_follow_subscription
 */
@Entity
@Table(name = "user_follows", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"follower_id", "following_id", "follow_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserFollow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_id", nullable = false)
    private Long followerId; // 팔로우하는 사용자

    @Column(name = "following_id", nullable = false)
    private Long followingId; // 팔로우 대상 (개인 채널 또는 기획사)

    @Enumerated(EnumType.STRING)
    @Column(name = "follow_type", nullable = false, length = 20)
    private FollowType followType; // CHANNEL(개인 채널), AGENCY(기획사)

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum FollowType {
        CHANNEL,  // 개인 채널 팔로우
        AGENCY    // 기획사 구독
    }
}
