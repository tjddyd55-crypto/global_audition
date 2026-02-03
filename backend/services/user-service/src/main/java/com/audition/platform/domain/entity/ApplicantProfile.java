package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applicant_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ApplicantProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId  // User 관계를 통해 userId를 자동으로 설정
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(name = "stage_name")
    private String stageName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "banner_url")
    private String bannerUrl;

    private String nationality; // 기존 필드 (하위 호환성 유지)
    private String gender;

    private LocalDate birthday;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "youtube_url")
    private String youtubeUrl;

    @Column(name = "instagram_id")
    private String instagramId;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_visibility", length = 20)
    private ChannelVisibility channelVisibility;

    // 국제화 필드
    @Column(length = 2)
    private String country; // ISO 3166-1 alpha-2 코드 (KR, US, JP 등)

    private String city;

    @Column(length = 50)
    private String phone; // 국가별 형식 다름

    @Column(columnDefinition = "TEXT")
    private String address; // 선택적

    @Column(length = 50)
    private String timezone; // 예: Asia/Seoul, America/New_York

    @Column(length = 500)
    private String languages; // 쉼표로 구분된 언어 코드 (ko, en, ja 등)

    @Column(name = "portfolio_slug", length = 100, unique = true)
    private String portfolioSlug; // 포트폴리오 공개 링크용 슬러그 (작업: 2026_18_portfolio_builder)

    @Column(name = "featured_video_id")
    private Long featuredVideoId; // 대표영상 ID (작업: MVP_02_creator_channel)

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ChannelVisibility {
        PUBLIC,
        UNLISTED,
        PRIVATE
    }
}
