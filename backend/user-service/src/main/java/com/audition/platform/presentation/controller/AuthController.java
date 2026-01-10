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
            // 요청 데이터 로깅 (디버깅용)
            System.out.println("=== Registration Request ===");
            System.out.println("Email: " + request.getEmail());
            System.out.println("Name: " + request.getName());
            System.out.println("UserType: " + request.getUserType());
            System.out.println("Country: " + request.getCountry());
            System.out.println("BusinessCountry: " + request.getBusinessCountry());
            System.out.println("City: " + request.getCity());
            System.out.println("BusinessCity: " + request.getBusinessCity());
            System.out.println("Birthday: " + request.getBirthday());
            System.out.println("CompanyName: " + request.getCompanyName());
            System.out.println("BusinessRegistrationNumber: " + request.getBusinessRegistrationNumber());
            
            AuthResponse response = authService.register(request);
            System.out.println("=== Registration Success ===");
            System.out.println("UserId: " + response.getUserId());
            System.out.println("Email: " + response.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException ex) {
            // 비즈니스 로직 예외는 400 Bad Request로 반환
            Map<String, Object> error = new HashMap<>();
            error.put("message", ex.getMessage());
            error.put("status", HttpStatus.BAD_REQUEST.value());
            error.put("error", "ValidationError");
            
            System.err.println("=== Registration Validation Error ===");
            System.err.println("Message: " + ex.getMessage());
            System.err.println("Exception Type: " + ex.getClass().getName());
            ex.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception ex) {
            // 예상치 못한 예외는 500 Internal Server Error로 반환 (GlobalExceptionHandler에서 처리)
            System.err.println("=== Registration Unexpected Error ===");
            System.err.println("Exception Type: " + ex.getClass().getName());
            System.err.println("Message: " + ex.getMessage());
            if (ex.getCause() != null) {
                System.err.println("Cause: " + ex.getCause().getClass().getName());
                System.err.println("Cause Message: " + ex.getCause().getMessage());
            }
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
}
