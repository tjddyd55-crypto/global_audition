package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.CreativeAsset;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 창작물 자산 DTO
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreativeAssetDto {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private CreativeAsset.AssetType assetType;
    private String fileUrl;
    private String textContent;
    private String contentHash;
    private Long fileSize;
    private String mimeType;
    private String declaredCreationType;
    private CreativeAsset.AccessControl accessControl;
    private LocalDateTime registeredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
