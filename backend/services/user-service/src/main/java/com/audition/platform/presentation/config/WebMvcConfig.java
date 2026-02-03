package com.audition.platform.presentation.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ObjectProvider<AdminAuditInterceptor> adminAuditInterceptorProvider;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        AdminAuditInterceptor interceptor = adminAuditInterceptorProvider.getIfAvailable();
        if (interceptor == null) {
            return;
        }
        registry.addInterceptor(interceptor)
                .addPathPatterns("/api/v1/admin/**")
                .excludePathPatterns("/api/v1/admin/audit-logs/**");
    }
}
