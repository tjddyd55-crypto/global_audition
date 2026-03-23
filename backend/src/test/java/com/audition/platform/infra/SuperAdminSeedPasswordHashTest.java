package com.audition.platform.infra;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * V17 시드 비밀번호가 Spring BCrypt와 일치하는지 검증한다.
 */
class SuperAdminSeedPasswordHashTest {

    private static final String V17_HASH =
            "$2b$10$pP5ZBt/NB4bQflGYBzwP1uM81NbxHBh7pYZWcEABFKZAU5RqjYsXC";

    @Test
    void v17SeedPasswordMatchesSpringBcrypt() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertTrue(encoder.matches("SuperAdmin!ChangeMe", V17_HASH));
    }
}
