package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.CreativeAsset;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 창작물 자산 생성 요청
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCreativeAssetRequest {
    @NotBlank(message = "제목은 필수입니다")
    private String title;

    private String description;

    @NotNull(message = "자산 타입은 필수입니다")
    private CreativeAsset.AssetType assetType; // LYRIC, COMPOSITION, DEMO_AUDIO 등

    // 파일 업로드 또는 텍스트 입력 중 하나
    private String fileUrl; // 파일 업로드인 경우
    private String textContent; // 텍스트 입력인 경우 (가사 등)

    private String declaredCreationType; // HUMAN, AI_ASSISTED, AI_GENERATED

    @NotNull(message = "접근 제어 설정은 필수입니다")
    private CreativeAsset.AccessControl accessControl; // PUBLIC, AUDITION_ONLY, PRIVATE
}
