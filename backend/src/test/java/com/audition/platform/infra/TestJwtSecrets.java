package com.audition.platform.infra;

import com.audition.platform.infra.TestJwtSecrets;

/**
 * 테스트 클래스패스 전용 서명 키. 운영 설정이나 기본값으로 쓰지 않는다.
 */
public final class TestJwtSecrets {

    public static final String ACCEPTABLE = "test-only-jwt-secret-not-for-production-use-32b";

    private TestJwtSecrets() {
    }
}
