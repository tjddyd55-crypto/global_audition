package com.audition.platform.infra;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, authException) -> writeApiError(response, 401, "로그인이 필요합니다."))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                        writeApiError(response, 403, "접근 권한이 없습니다."))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/signup").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/me").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/health", "/api/version").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/uploads/health").permitAll()
                .requestMatchers("/actuator/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/credits/public/policies/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auditions", "/api/auditions/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auditions/*/votes").permitAll()
                // 이미지 업로드: 로그인(JWT)만 필수. 역할 제한 시 지원자 등 정상 세션에서 403 발생함.
                .requestMatchers(HttpMethod.POST, "/api/uploads/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/applications").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/applications/*/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/comments").permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/applications/*/view", "POST")).permitAll()
                .requestMatchers("/api/me/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void writeApiError(HttpServletResponse response, int status, String message) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        String escaped = message.replace("\\", "\\\\").replace("\"", "\\\"");
        response.getWriter().write("{\"success\":false,\"message\":\"" + escaped + "\"}");
    }
}
