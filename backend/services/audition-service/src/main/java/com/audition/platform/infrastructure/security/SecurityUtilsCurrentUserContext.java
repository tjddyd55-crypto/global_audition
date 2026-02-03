package com.audition.platform.infrastructure.security;

import org.springframework.stereotype.Component;

@Component
public class SecurityUtilsCurrentUserContext implements CurrentUserContext {
    @Override
    public Long getCurrentUserIdOrThrow() {
        return SecurityUtils.getCurrentUserIdOrThrow();
    }

    @Override
    public void requireAdmin() {
        SecurityUtils.requireAdmin();
    }
}

