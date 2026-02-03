package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_contents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class VideoContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "video_url", nullable = false)
    private String videoUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    private Integer duration; // 초 단위

    @Column(name = "view_count")
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "like_count")
    @Builder.Default
    private Long likeCount = 0L;

    @Column(name = "comment_count")
    @Builder.Default
    private Long commentCount = 0L;

    @Enumerated(EnumType.STRING)
    private VideoCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "video_type", length = 20)
    @Builder.Default
    private VideoType videoType = VideoType.ORIGINAL; // 자작곡/작곡곡/커버곡

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", length = 20)
    @Builder.Default
    private Visibility visibility = Visibility.PUBLIC; // 공개 범위

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VideoStatus status = VideoStatus.PUBLISHED;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VideoCategory {
        SINGER,
        DANCER,
        ACTOR,
        MODEL,
        INSTRUMENT
    }

    public enum VideoType {
        ORIGINAL,      // 자작곡
        COMPOSITION,   // 작곡곡
        COVER          // 커버곡
    }

    public enum Visibility {
        PUBLIC,         // 공개
        PRIVATE,        // 비공개
        FOLLOWERS_ONLY  // 팔로워만
    }

    public enum VideoStatus {
        PUBLISHED,
        PRIVATE,
        DELETED
    }
}
