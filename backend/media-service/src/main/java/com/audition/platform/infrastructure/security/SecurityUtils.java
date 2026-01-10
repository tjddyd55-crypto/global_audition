package com.audition.platform.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * 보안 유틸리티 클래스
 * TODO: Media Service에 Spring Security를 추가하면 SecurityContext를 사용하도록 변경 필요
 */
@Component
public class SecurityUtils {
    
    @Value("${jwt.secret:your-secret-key-should-be-at-least-256-bits-long-for-hs256-algorithm}")
    private String jwtSecret;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * Authorization 헤더에서 사용자 ID를 추출합니다.
     * @param authHeader Authorization 헤더 값 (Bearer 토큰)
     * @return 사용자 ID (토큰이 유효하지 않은 경우 null)
     */
    public Long getUserIdFromAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        try {
            String token = authHeader.substring(7);
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            String subject = claims.getSubject();
            return Long.parseLong(subject);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Authorization 헤더에서 사용자 ID를 추출합니다.
     * 유효하지 않은 경우 예외를 발생시킵니다.
     * @param authHeader Authorization 헤더 값 (Bearer 토큰)
     * @return 사용자 ID
     * @throws RuntimeException 토큰이 유효하지 않은 경우
     */
    public Long getUserIdFromAuthHeaderOrThrow(String authHeader) {
        Long userId = getUserIdFromAuthHeader(authHeader);
        if (userId == null) {
            throw new RuntimeException("인증이 필요합니다");
        }
        return userId;
    }
}
