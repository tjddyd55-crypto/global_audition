package com.audition.platform.infrastructure.client;

import com.audition.platform.application.dto.UserSummaryDto;
import com.audition.platform.application.service.InternalUserService;
import com.audition.platform.application.service.UserRoleValidator;
import com.audition.platform.domain.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * User Service 내부 API 클라이언트 (프로덕션: api-backend 통합 구조)
 * 
 * 서버 기준선(SSOT): api-backend는 gateway + user-domain + audition-domain이 하나의 배포 단위
 * - localhost/포트 기반 통신 금지
 * - api-backend 내부는 직접 서비스 주입 사용
 * - media-service와의 통신만 도메인 기반 HTTP 호출
 * 
 * 통합 배포 시 user-domain과 audition-domain은 같은 애플리케이션 컨텍스트에 있으므로
 * HTTP 호출 대신 직접 서비스 주입을 사용한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserServiceClient {

    // 프로덕션: api-backend 통합 구조에서는 직접 서비스 주입 사용
    // 통합 배포 시 user-domain과 audition-domain은 같은 애플리케이션 컨텍스트
    private final InternalUserService internalUserService;
    private final UserRoleValidator userRoleValidator;

    /**
     * 사용자 요약 정보 조회 (프로덕션: 직접 서비스 호출)
     * 
     * 서버 기준선: api-backend 통합 구조에서는 HTTP 호출 대신 직접 서비스 주입 사용
     * 
     * @param userId 사용자 ID
     * @return 사용자 요약 정보 (실패 시 null 반환)
     */
    public UserSummaryDto getUserSummary(Long userId) {
        try {
            return internalUserService.getUserSummary(userId);
        } catch (Exception e) {
            log.warn("User Service 내부 API 호출 실패: userId={}, error={}", userId, e.getMessage());
            return null;
        }
    }

    /**
     * 사용자 역할 조회 (STEP 1: 권한 체크용, 프로덕션: 직접 서비스 호출)
     * 
     * 서버 기준선: api-backend 통합 구조에서는 HTTP 호출 대신 직접 서비스 주입 사용
     * 
     * @param userId 사용자 ID
     * @return 사용자 역할 (APPLICANT, AGENCY, TRAINER, ADMIN)
     * @throws ResponseStatusException 권한 체크 실패 시
     */
    public String getUserRole(Long userId) {
        try {
            User.UserType userType = userRoleValidator.getUserRole(userId);
            String role = userType.name();
            // BUSINESS → AGENCY로 매핑 (하위 호환성)
            if (role.equals("BUSINESS")) {
                role = "AGENCY";
            }
            return role;
        } catch (Exception e) {
            log.error("User Service 역할 조회 실패: userId={}, error={}", userId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "권한 확인 중 오류가 발생했습니다");
        }
    }

    /**
     * 역할 기반 권한 체크 (STEP 1)
     * 
     * @param userId 사용자 ID
     * @param requiredRole 필수 역할
     * @throws ResponseStatusException 권한이 없을 경우 403
     */
    public void requireRole(Long userId, String requiredRole) {
        String userRole = getUserRole(userId);
        if (!userRole.equals(requiredRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    String.format("%s 권한이 필요합니다. 현재 역할: %s", requiredRole, userRole));
        }
    }

    /**
     * 여러 역할 중 하나라도 있으면 허용 (STEP 1)
     * 
     * @param userId 사용자 ID
     * @param allowedRoles 허용된 역할 목록
     * @throws ResponseStatusException 권한이 없을 경우 403
     */
    public void requireAnyRole(Long userId, String... allowedRoles) {
        String userRole = getUserRole(userId);
        for (String allowedRole : allowedRoles) {
            if (userRole.equals(allowedRole)) {
                return; // 허용됨
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                String.format("권한이 없습니다. 현재 역할: %s, 필요 역할: %s", userRole, String.join(", ", allowedRoles)));
    }
}
