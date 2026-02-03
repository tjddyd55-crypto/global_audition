package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.UserRoleDto;
import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.application.service.InternalUserService;
import com.audition.platform.application.service.UserRoleValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 내부 API 컨트롤러
 * 서비스 간 통신 전용 (외부 노출 금지)
 */
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
@Tag(name = "Internal User API", description = "내부 API - 서비스 간 통신 전용")
public class InternalUserController {

    private final InternalUserService internalUserService;
    private final UserRoleValidator userRoleValidator;

    @GetMapping("/{userId}/summary")
    @Operation(summary = "사용자 요약 정보 조회", description = "내부 API - 다른 서비스에서 사용자 기본 정보 조회")
    public ResponseEntity<UserSummaryDto> getUserSummary(@PathVariable Long userId) {
        UserSummaryDto summary = internalUserService.getUserSummary(userId);
        return ResponseEntity.ok(summary);
    }

    /**
     * 사용자 역할 조회 (STEP 1)
     * 내부 API - 다른 서비스에서 권한 체크용으로 사용
     */
    @GetMapping("/{userId}/role")
    @Operation(summary = "사용자 역할 조회", description = "내부 API - 다른 서비스에서 권한 체크용")
    public ResponseEntity<UserRoleDto> getUserRole(@PathVariable Long userId) {
        com.audition.platform.domain.entity.User.UserType role = userRoleValidator.getUserRole(userId);
        // BUSINESS → AGENCY로 매핑 (하위 호환성)
        String roleName = role.name();
        if (roleName.equals("BUSINESS")) {
            roleName = "AGENCY";
        }
        return ResponseEntity.ok(UserRoleDto.builder()
                .userId(userId)
                .role(roleName)
                .build());
    }
}
