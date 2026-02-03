package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내부 API용 사용자 요약 정보 DTO
 * 다른 서비스에서 사용자 기본 정보를 조회할 때 사용
 * STEP 1: role 추가
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long userId;
    private String userName;
    private String role; // STEP 1: 사용자 역할 (APPLICANT, AGENCY, TRAINER, ADMIN)
    private String businessName; // null 가능 (기획사가 아닌 경우)
    private String profileImageUrl; // null 가능
}
