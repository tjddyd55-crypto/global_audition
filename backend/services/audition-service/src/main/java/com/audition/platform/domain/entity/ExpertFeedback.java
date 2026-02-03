package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 전문가 평가 엔티티
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Entity
@Table(name = "expert_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ExpertFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id", nullable = false)
    private Long assetId; // Creative Asset ID (Media Service 참조)

    @Column(name = "evaluator_id", nullable = false)
    private Long evaluatorId; // 평가자 ID

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluator_type", nullable = false, length = 20)
    private EvaluatorType evaluatorType;

    @Column(name = "rating")
    private Integer rating; // 1-5 점수

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "evidence_link", length = 500)
    private String evidenceLink; // 증거 패키지 보기 링크 (레지스트리/에스크로 서비스에서 생성)

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true; // 공개 여부 (true: 창작자 프로필 노출, false: 창작자만 확인)

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EvaluatorType {
        AGENCY,              // 기획사
        CERTIFIED_EVALUATOR  // 인증 평가자
    }
}
