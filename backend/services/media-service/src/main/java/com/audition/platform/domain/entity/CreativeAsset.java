package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 창작물 자산 엔티티 (Creative Vault)
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Entity
@Table(name = "creative_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CreativeAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 50)
    private AssetType assetType;

    @Column(name = "file_url", length = 500)
    private String fileUrl; // 파일 업로드인 경우

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent; // 텍스트 입력인 경우 (가사 등)

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash; // SHA-256 해시 (파일 또는 텍스트)

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "declared_creation_type", length = 50)
    private String declaredCreationType; // HUMAN, AI_ASSISTED, AI_GENERATED

    @Enumerated(EnumType.STRING)
    @Column(name = "access_control", nullable = false, length = 20)
    @Builder.Default
    private AccessControl accessControl = AccessControl.PRIVATE;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AssetType {
        LYRIC,          // 가사 텍스트
        COMPOSITION,    // 악보/미디/프로젝트 파일
        DEMO_AUDIO,     // 데모 음원
        VOCAL_GUIDE,    // 가이드 보컬
        STEMS,          // 스텝/트랙
        AI_GENERATED,   // AI 생성물
        AI_ASSISTED     // AI 보조
    }

    public enum AccessControl {
        PUBLIC,         // 공개
        AUDITION_ONLY,  // 오디션 참가자만
        PRIVATE         // 비공개
    }
}
