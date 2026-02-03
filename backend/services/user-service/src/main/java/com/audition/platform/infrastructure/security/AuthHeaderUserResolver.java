package com.audition.platform.infrastructure.security;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

/**
 * 인증 헤더에서 사용자 정보 추출 (STEP 1: role 포함)
 */
@Component
@RequiredArgsConstructor
public class AuthHeaderUserResolver {

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * 인증 헤더에서 사용자 ID 추출 (예외 발생)
     */
    public Long getUserIdFromAuthHeaderOrThrow(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다");
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다");
        }

        return jwtTokenProvider.getUserIdFromToken(token);
    }

    /**
     * 인증 헤더에서 사용자 ID 추출 (null 반환)
     */
    public Long getUserIdFromAuthHeader(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            return null;
        }

        return jwtTokenProvider.getUserIdFromToken(token);
    }

    /**
     * 인증 헤더에서 role 추출 (STEP 1)
     */
    public String getRoleFromAuthHeaderOrThrow(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증이 필요합니다");
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다");
        }

        return jwtTokenProvider.getRoleFromToken(token);
    }

    /**
     * 인증 헤더에서 role 추출 (null 반환)
     */
    public String getRoleFromAuthHeader(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            return null;
        }

        return jwtTokenProvider.getRoleFromToken(token);
    }
}

