package com.audition.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 지원서 생성 요청
 * 작업: GA_20260202_CREATIVE_REGISTRY_EXTENSION - assetIds 추가
 */
@Data
public class CreateApplicationRequest {
    @NotNull(message = "오디션 ID는 필수입니다")
    private Long auditionId;

    private Long videoId1;
    private Long videoId2;
    
    private List<String> photos;
    
    // Creative Vault asset_id 목록 (파일 업로드 대신 참조)
    private List<Long> assetIds;
    
    private String paymentMethod; // PAYPAL, STRIPE 등
}
