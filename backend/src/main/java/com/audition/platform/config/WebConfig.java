package com.audition.platform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.Objects;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * 쉼표 구분 추가 Origin(커스텀 도메인 등). 비우면 Railway·로컬은 패턴만 사용.
     */
    @Value("${app.cors.allowed-origins:}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        var mapping = registry.addMapping("/api/**")
            // PATCH: 오디션 수정·크레딧 등 — allowCredentials 시 메서드 와일드카드 미사용
            .allowedMethods("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);

        // 프론트는 Next rewrite로 동일 Origin 호출이 기본. 크로스 오리진은 로컬 개발·도구용만.
        mapping.allowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*"
        );

        String[] extra = parseAllowedOrigins();
        if (extra.length > 0) {
            mapping.allowedOrigins(Objects.requireNonNull(extra));
        }
    }

    private String[] parseAllowedOrigins() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return new String[0];
        }
        return Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isEmpty())
            .toArray(String[]::new);
    }
}
