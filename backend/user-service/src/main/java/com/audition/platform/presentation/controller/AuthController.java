package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.AuthResponse;
import com.audition.platform.application.dto.LoginRequest;
import com.audition.platform.application.dto.RegisterRequest;
import com.audition.platform.application.dto.SocialLoginRequest;
import com.audition.platform.application.dto.UserDto;
import com.audition.platform.application.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "인증 API")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "회원가입")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            // 요청 데이터 전체 로깅 (JSON 형식으로)
            System.out.println("========================================");
            System.out.println("=== Registration Request (Full JSON) ===");
            System.out.println("========================================");
            
            // ObjectMapper를 사용하여 전체 객체를 JSON으로 출력
            try {
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                String requestJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(request);
                System.out.println(requestJson);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                System.err.println("Failed to serialize request to JSON: " + e.getMessage());
                // JSON 변환 실패해도 계속 진행
            }
            System.out.println("========================================");
            
            // 개별 필드 검증 로깅
            System.out.println("Email: " + (request.getEmail() != null ? request.getEmail() : "NULL"));
            System.out.println("Password: " + (request.getPassword() != null ? "***" : "NULL"));
            System.out.println("Name: " + (request.getName() != null ? request.getName() : "NULL"));
            System.out.println("UserType: " + (request.getUserType() != null ? request.getUserType() : "NULL"));
            
            if (request.getUserType() == com.audition.platform.domain.entity.User.UserType.APPLICANT) {
                System.out.println("[APPLICANT] Country: " + request.getCountry());
                System.out.println("[APPLICANT] City: " + request.getCity());
                System.out.println("[APPLICANT] Birthday: " + request.getBirthday());
                System.out.println("[APPLICANT] Phone: " + request.getPhone());
                System.out.println("[APPLICANT] Languages: " + request.getLanguages());
            } else if (request.getUserType() == com.audition.platform.domain.entity.User.UserType.BUSINESS) {
                System.out.println("[BUSINESS] BusinessCountry: " + request.getBusinessCountry());
                System.out.println("[BUSINESS] BusinessCity: " + request.getBusinessCity());
                System.out.println("[BUSINESS] CompanyName: " + request.getCompanyName());
                System.out.println("[BUSINESS] BusinessRegistrationNumber: " + request.getBusinessRegistrationNumber());
            }
            
            AuthResponse response = authService.register(request);
            
            System.out.println("========================================");
            System.out.println("=== Registration Success ===");
            System.out.println("UserId: " + response.getUserId());
            System.out.println("Email: " + response.getEmail());
            System.out.println("========================================");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            // 비즈니스 로직 예외는 400 Bad Request로 반환
            System.err.println("========================================");
            System.err.println("=== Registration RuntimeException ===");
            System.err.println("========================================");
            System.err.println("Exception Type: " + ex.getClass().getName());
            System.err.println("Message: " + ex.getMessage());
            if (ex.getCause() != null) {
                System.err.println("Cause Type: " + ex.getCause().getClass().getName());
                System.err.println("Cause Message: " + ex.getCause().getMessage());
            }
            System.err.println("=== Stack Trace ===");
            ex.printStackTrace();
            System.err.println("========================================");
            
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "ValidationError");
            error.put("exceptionType", ex.getClass().getName());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception ex) {
            // 예상치 못한 예외는 상세 로깅 후 re-throw (GlobalExceptionHandler에서 처리)
            System.err.println("========================================");
            System.err.println("=== Registration Exception (500) ===");
            System.err.println("========================================");
            System.err.println("Exception Type: " + ex.getClass().getName());
            System.err.println("Message: " + (ex.getMessage() != null ? ex.getMessage() : "null"));
            
            Throwable cause = ex.getCause();
            int depth = 0;
            while (cause != null && depth < 5) {
                System.err.println("Cause [" + depth + "] Type: " + cause.getClass().getName());
                System.err.println("Cause [" + depth + "] Message: " + cause.getMessage());
                
                // SQLException의 경우 상세 정보 출력
                if (cause instanceof java.sql.SQLException) {
                    java.sql.SQLException sqlEx = (java.sql.SQLException) cause;
                    System.err.println("SQL State: " + sqlEx.getSQLState());
                    System.err.println("SQL Error Code: " + sqlEx.getErrorCode());
                    System.err.println("SQL Message: " + sqlEx.getMessage());
                }
                
                // DataIntegrityViolationException의 경우
                if (cause instanceof org.springframework.dao.DataIntegrityViolationException) {
                    org.springframework.dao.DataIntegrityViolationException divEx = (org.springframework.dao.DataIntegrityViolationException) cause;
                    System.err.println("DataIntegrityViolationException Message: " + divEx.getMessage());
                }
                
                cause = cause.getCause();
                depth++;
            }
            
            System.err.println("=== Full Stack Trace ===");
            ex.printStackTrace();
            System.err.println("========================================");
            
            throw ex; // GlobalExceptionHandler에서 처리하도록 re-throw
        }
    }

    @PostMapping("/login")
    @Operation(summary = "로그인")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/social/login")
    @Operation(summary = "소셜 로그인 (Google, Kakao, Naver)")
    public ResponseEntity<AuthResponse> socialLogin(@RequestBody @Valid SocialLoginRequest request) {
        AuthResponse response = authService.socialLogin(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "현재 로그인한 사용자 정보 조회")
    public ResponseEntity<UserDto> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("인증 토큰이 필요합니다");
        }
        // Bearer 토큰에서 사용자 ID 추출
        String token = authHeader.replace("Bearer ", "");
        Long userId = authService.getUserIdFromToken(token);
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "사용자 정보 조회")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        UserDto user = authService.getUserById(id);
        return ResponseEntity.ok(user);
    }
}
