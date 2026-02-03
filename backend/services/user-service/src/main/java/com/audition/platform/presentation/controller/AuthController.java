package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.*;
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
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            // 비즈니스 로직 예외는 400 Bad Request로 반환
            System.err.println("Registration error: " + ex.getMessage());
            ex.printStackTrace();
            
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "ValidationError");
            error.put("exceptionType", ex.getClass().getName());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception ex) {
            // 예상치 못한 예외는 GlobalExceptionHandler에서 처리
            System.err.println("Unexpected registration error: " + ex.getMessage());
            ex.printStackTrace();
            throw ex;
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

    @PostMapping("/find-user-id")
    @Operation(summary = "아이디 찾기 (이름과 이메일로 찾기)")
    public ResponseEntity<?> findUserId(@RequestBody @Valid FindUserIdRequest request) {
        try {
            FindUserIdResponse response = authService.findUserId(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "NotFoundError");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "비밀번호 찾기 (재설정 토큰 발급)")
    public ResponseEntity<?> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        try {
            ForgotPasswordResponse response = authService.forgotPassword(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "NotFoundError");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "비밀번호 재설정")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            Map<String, Object> response = new HashMap<>();
            response.put("message", "비밀번호가 성공적으로 재설정되었습니다");
            response.put("status", HttpStatus.OK.value());
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "ValidationError");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}
