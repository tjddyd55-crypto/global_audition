package com.audition.platform.infra;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 로그인 응답에 HttpOnly JWT 쿠키를 내려, Authorization 헤더 없이도 동일 Origin `/api` 프록시 요청이 인증되도록 한다.
 * 크로스 오리진 직접 호출 시에는 {@code app.cors} + {@code withCredentials} 와 함께 사용한다.
 */
@Component
public class AuthSessionCookieWriter {

    public static final String COOKIE_ACCESS = "accessToken";

    private static final String[] ALL_NAMES = {COOKIE_ACCESS, "auth_token", "token"};

    private final JwtService jwtService;

    @Value("${app.auth.cookie.enabled:true}")
    private boolean enabled;

    /**
     * None | Lax | Strict. None 은 반드시 Secure 쿠키와 함께(HTTPS).
     */
    @Value("${app.auth.cookie.same-site:None}")
    private String sameSite;

    public AuthSessionCookieWriter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public void addAccessTokenCookie(HttpServletRequest request, HttpServletResponse response, String token) {
        if (!enabled || token == null || token.isBlank()) {
            return;
        }
        boolean secure = request.isSecure();
        String site = normalizeSameSite(sameSite, secure);
        long maxAgeSec = Math.max(1L, jwtService.getExpirationMs() / 1000);
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(COOKIE_ACCESS, token, secure, site, maxAgeSec).toString());
    }

    public void clearAccessTokenCookies(HttpServletRequest request, HttpServletResponse response) {
        boolean secure = request.isSecure();
        String site = normalizeSameSite(sameSite, secure);
        for (String name : ALL_NAMES) {
            response.addHeader(
                    HttpHeaders.SET_COOKIE,
                    ResponseCookie.from(name, "")
                            .httpOnly(true)
                            .secure(secure)
                            .path("/")
                            .maxAge(Duration.ZERO)
                            .sameSite(site)
                            .build()
                            .toString());
        }
    }

    private static String normalizeSameSite(String requested, boolean secure) {
        if (requested == null || requested.isBlank()) {
            return "Lax";
        }
        String s = requested.trim();
        if ("None".equalsIgnoreCase(s) && !secure) {
            return "Lax";
        }
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private static ResponseCookie buildCookie(String name, String value, boolean secure, String sameSite, long maxAgeSec) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(maxAgeSec))
                .sameSite(sameSite)
                .build();
    }
}
