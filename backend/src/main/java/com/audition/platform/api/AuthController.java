package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.AuthMeDataDto;
import com.audition.platform.api.dto.AuthResponse;
import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.AuthService;
import com.audition.platform.infra.AuthSessionCookieWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthSessionCookieWriter authSessionCookieWriter;

    public AuthController(AuthService authService, AuthSessionCookieWriter authSessionCookieWriter) {
        this.authService = authService;
        this.authSessionCookieWriter = authSessionCookieWriter;
    }

    @PostMapping("/signup")
    public AuthResponse signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse res = authService.signup(request);
        authSessionCookieWriter.addAccessTokenCookie(httpRequest, httpResponse, res.getToken());
        return res;
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        AuthResponse res = authService.login(request);
        authSessionCookieWriter.addAccessTokenCookie(httpRequest, httpResponse, res.getToken());
        return res;
    }

    @PostMapping("/logout")
    public ApiEnvelope<Boolean> logout(HttpServletRequest request, HttpServletResponse response) {
        authSessionCookieWriter.clearAccessTokenCookies(request, response);
        return ApiEnvelope.ok(true);
    }

    @GetMapping("/me")
    public ApiEnvelope<AuthMeDataDto> me() {
        return ApiEnvelope.ok(authService.meData());
    }
}
