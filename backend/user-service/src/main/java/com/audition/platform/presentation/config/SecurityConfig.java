package com.audition.platform.presentation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Actuator 엔드포인트 허용
                        .requestMatchers("/actuator/**").permitAll()
                        // Public auth endpoints
                        .requestMatchers("/api/v1/auth/register").permitAll()
                        .requestMatchers("/api/v1/auth/login").permitAll()
                        .requestMatchers("/api/v1/auth/social/login").permitAll()
                        .requestMatchers("/api/v1/auth/me").permitAll()
                        // Swagger/API docs
                        .requestMatchers("/api-docs/**").permitAll()
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/swagger-ui.html").permitAll()
                        // 인증 필요한 auth 엔드포인트
                        .requestMatchers("/api/v1/auth/**").authenticated()
                        // 나머지 모든 요청은 인증 필요
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}
