package com.audition.platform.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 역할 정보 DTO (STEP 1)
 * 다른 서비스에서 권한 체크용으로 사용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleDto {
    private Long userId;
    private String role; // APPLICANT, AGENCY, TRAINER, ADMIN
}
