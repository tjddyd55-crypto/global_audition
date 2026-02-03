package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 영상 타임코드 기반 피드백 엔티티
 * 작업: 2026_13_video_feedback
 */
@Entity
@Table(name = "video_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class VideoFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id", nullable = false)
    private VideoContent video;

    @Column(name = "user_id", nullable = false)
    private Long userId; // 피드백 작성자

    @Column(name = "timestamp_seconds", nullable = false)
    private Integer timestampSeconds; // 타임코드 (초 단위)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String comment; // 피드백 내용

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
