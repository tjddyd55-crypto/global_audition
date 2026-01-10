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
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            // 예외 상세 정보를 포함한 응답
            Map<String, Object> error = new HashMap<>();
            error.put("message", "회원가입 실패: " + ex.getMessage());
            error.put("exceptionType", ex.getClass().getName());
            error.put("exceptionMessage", ex.getMessage());
            
            // 스택 트레이스 정보 추가
            StackTraceElement[] stackTrace = ex.getStackTrace();
            if (stackTrace.length > 0) {
                error.put("firstStackTrace", stackTrace[0].toString());
            }
            
            if (ex.getCause() != null) {
                error.put("cause", ex.getCause().getClass().getName() + ": " + ex.getCause().getMessage());
                if (ex.getCause().getCause() != null) {
                    error.put("rootCause", ex.getCause().getCause().getClass().getName() + ": " + ex.getCause().getCause().getMessage());
                }
            }
            
            // 로그 출력
            System.err.println("=== Registration Error ===");
            System.err.println("Exception: " + ex.getClass().getName());
            System.err.println("Message: " + ex.getMessage());
            ex.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
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
