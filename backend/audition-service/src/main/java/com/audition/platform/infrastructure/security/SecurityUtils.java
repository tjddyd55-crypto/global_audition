package com.audition.platform.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {
    
    /**
     * SecurityContext에서 현재 인증된 사용자 ID를 가져옵니다.
     * @return 사용자 ID (인증되지 않은 경우 null)
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        
        return null;
    }
    
    /**
     * SecurityContext에서 현재 인증된 사용자 ID를 가져옵니다.
     * 인증되지 않은 경우 예외를 발생시킵니다.
     * @return 사용자 ID
     * @throws RuntimeException 인증되지 않은 경우
     */
    public static Long getCurrentUserIdOrThrow() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("인증이 필요합니다");
        }
        return userId;
    }
    
    /**
     * 현재 인증된 사용자가 특정 역할을 가지고 있는지 확인합니다.
     * @param role 역할 (예: "BUSINESS", "APPLICANT")
     * @return 역할을 가지고 있으면 true
     */
    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
}
