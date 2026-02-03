package com.audition.platform.presentation.config;

import com.audition.platform.application.service.AuditLogService;
import com.audition.platform.infrastructure.security.AuthHeaderUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@ConditionalOnBean(AuthHeaderUserResolver.class)
public class AdminAuditInterceptor implements HandlerInterceptor {

    private final AuthHeaderUserResolver authHeaderUserResolver;
    private final AuditLogService auditLogService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (!path.startsWith("/api/v1/admin/")) {
            return true;
        }
        if (path.startsWith("/api/v1/admin/audit-logs")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        Long adminId = authHeaderUserResolver.getUserIdFromAuthHeaderOrThrow(authHeader);
        String message = request.getMethod() + " " + path;
        auditLogService.appendAdminRequestLog(adminId, "ADMIN_REQUEST", message, request.getQueryString());
        return true;
    }
}
