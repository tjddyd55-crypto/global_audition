package com.audition.platform.infra;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * API JSON 응답이 브라우저·중간 캐시에 저장되는 것을 막는다.
 * 프론트와 별개로, 동일 URL GET이 캐시 히트만 나고 UI가 갱신되지 않는 현상을 줄인다.
 */
@Component
public class ApiCacheControlFilter extends OncePerRequestFilter implements Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 50;
    }

    private static final String NO_STORE = "no-store, no-cache, must-revalidate";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !normalizedPath(request).startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        response.setHeader(HttpHeaders.CACHE_CONTROL, NO_STORE);
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        filterChain.doFilter(request, response);
    }

    private static String normalizedPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String context = request.getContextPath();
        if (context != null && !context.isEmpty() && uri.startsWith(context)) {
            return uri.substring(context.length());
        }
        return uri;
    }
}
