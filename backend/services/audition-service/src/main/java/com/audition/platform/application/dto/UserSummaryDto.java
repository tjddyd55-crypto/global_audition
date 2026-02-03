package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내부 API용 사용자 요약 정보 DTO
 * User Service에서 조회한 사용자 기본 정보
 * 작업: 2026_03_service_integration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long userId;
    private String userName;
    private String businessName; // null 가능 (기획사가 아닌 경우)
    private String profileImageUrl; // null 가능
}
