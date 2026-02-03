package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 콘텐츠 신고 엔티티
 * 작업: OPS_02_content_moderation
 */
@Entity
@Table(name = "content_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ContentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId; // 신고자

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 50)
    private ContentType contentType; // VIDEO, COMMENT, USER 등

    @Column(name = "content_id", nullable = false)
    private Long contentId; // 신고 대상 콘텐츠 ID

    @Column(nullable = false, length = 100)
    private String reason; // 신고 사유

    @Column(columnDefinition = "TEXT")
    private String description; // 상세 설명

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING; // PENDING, REVIEWING, RESOLVED, REJECTED

    @Column(name = "reviewed_by")
    private Long reviewedBy; // 검토자 (관리자)

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String resolution; // 처리 결과

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ContentType {
        VIDEO,    // 영상
        COMMENT,  // 댓글
        USER      // 사용자
    }

    public enum ReportStatus {
        PENDING,   // 대기
        REVIEWING, // 검토 중
        RESOLVED,  // 처리 완료
        REJECTED   // 기각
    }
}
