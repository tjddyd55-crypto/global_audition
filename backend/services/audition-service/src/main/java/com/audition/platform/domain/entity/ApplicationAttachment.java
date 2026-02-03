package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 지원서 첨부 자산 (Creative Vault 참조)
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Entity
@Table(name = "application_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ApplicationAttachment {

    @EmbeddedId
    private ApplicationAttachmentId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("applicationId")
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "asset_id", nullable = false, insertable = false, updatable = false)
    private Long assetId; // Creative Asset ID (Media Service 참조)

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ApplicationAttachmentId implements java.io.Serializable {
        @Column(name = "application_id")
        private Long applicationId;

        @Column(name = "asset_id")
        private Long assetId;
    }
}
