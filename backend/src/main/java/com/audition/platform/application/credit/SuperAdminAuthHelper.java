package com.audition.platform.application.credit;

import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * 슈퍼관리자 전용 API 진입 시 공통 권한 검사.
 */
public final class SuperAdminAuthHelper {

    private SuperAdminAuthHelper() {
    }

    public static void requireSuperAdmin() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!SecurityUtils.hasRole("SUPER_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "슈퍼관리자만 접근할 수 있습니다.");
        }
    }
}
