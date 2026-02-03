package com.audition.platform.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 환경 변수 검증 컴포넌트
 * 작업: 2026_07_production_hardening
 */
@Component
@Slf4j
public class EnvironmentValidator {

    private final Environment environment;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    public EnvironmentValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateEnvironment() {
        log.info("환경 변수 검증 시작...");
        
        // 필수 환경 변수 검증
        validateRequired("jwt.secret", jwtSecret, "JWT Secret은 필수입니다");
        validateRequired("spring.datasource.url", datasourceUrl, "데이터베이스 URL은 필수입니다");
        
        // JWT Secret 길이 검증 (최소 256비트 = 32바이트 = 64자)
        if (jwtSecret.length() < 32) {
            log.warn("JWT Secret이 너무 짧습니다. 최소 32자 이상 권장합니다.");
        }
        
        // 프로덕션 환경에서 추가 검증
        String activeProfile = environment.getActiveProfiles().length > 0 
                ? environment.getActiveProfiles()[0] 
                : "default";
        
        if ("prod".equals(activeProfile) || "production".equals(activeProfile)) {
            validateProductionEnvironment();
        }
        
        log.info("환경 변수 검증 완료");
    }

    private void validateRequired(String key, String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            log.error("필수 환경 변수 누락: {} - {}", key, message);
            throw new IllegalStateException(message + " (환경 변수: " + key + ")");
        }
    }

    private void validateProductionEnvironment() {
        log.info("프로덕션 환경 검증 수행");
        
        // 프로덕션 환경에서는 기본값 사용 금지
        if (jwtSecret.contains("your-secret-key") || jwtSecret.contains("change-in-production")) {
            throw new IllegalStateException("프로덕션 환경에서는 JWT Secret을 반드시 변경해야 합니다");
        }
        
        // 데이터베이스 URL이 localhost인지 확인
        if (datasourceUrl.contains("localhost") || datasourceUrl.contains("127.0.0.1")) {
            log.warn("프로덕션 환경에서 localhost 데이터베이스 사용이 감지되었습니다. 실제 데이터베이스 서버를 사용해야 합니다.");
        }
    }
}
