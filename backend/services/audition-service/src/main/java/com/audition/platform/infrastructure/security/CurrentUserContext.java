package com.audition.platform.infrastructure.security;

public interface CurrentUserContext {
    Long getCurrentUserIdOrThrow();

    void requireAdmin();
}

