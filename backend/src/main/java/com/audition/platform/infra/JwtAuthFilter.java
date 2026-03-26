package com.audition.platform.infra;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (isPublicAuthWrite(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);
        try {
            io.jsonwebtoken.Claims claims = jwtService.parseToken(token);
            UUID userId = UUID.fromString(claims.getSubject());
            String role = claims.get("role", String.class);
            List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority("ROLE_" + role));
            var auth = new UsernamePasswordAuthenticationToken(
                    userId, null, authorities);
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception ignored) {
            // invalid token — leave context empty
        }
        filterChain.doFilter(request, response);
    }

    private static boolean isPublicAuthWrite(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String uri = request.getRequestURI();
        if (uri == null) {
            return false;
        }

        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        if (uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }

        return "/api/auth/login".equals(uri) || "/api/auth/signup".equals(uri);
    }
}
