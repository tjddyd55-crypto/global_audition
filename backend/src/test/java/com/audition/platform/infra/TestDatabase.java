package com.audition.platform.infra;

import org.springframework.test.context.DynamicPropertyRegistry;

/**
 * 통합 테스트 DB. 로컬/CI 서비스 Postgres 만 허용하고 원격(운영) 주소는 거부한다.
 */
public final class TestDatabase {

    public static final String URL = env("TEST_DB_URL", "jdbc:postgresql://localhost:5432/audition_hotfix_t49");
    public static final String USER = env("TEST_DB_USER", "postgres");
    public static final String PASSWORD = env("TEST_DB_PASSWORD", "postgres");

    private TestDatabase() {
    }

    public static void register(DynamicPropertyRegistry r) {
        assertLocal();
        r.add("spring.datasource.url", () -> URL);
        r.add("spring.datasource.username", () -> USER);
        r.add("spring.datasource.password", () -> PASSWORD);
    }

    public static void assertLocal() {
        if (!(URL.startsWith("jdbc:postgresql://localhost:") || URL.startsWith("jdbc:postgresql://127.0.0.1:"))) {
            throw new IllegalStateException("integration tests only run against a local Postgres");
        }
    }

    private static String env(String key, String fallback) {
        String v = System.getenv(key);
        return v == null || v.isBlank() ? fallback : v;
    }
}
