package com.audition.platform.infra;

/**
 * 테스트 전용 서명 키. 운영 기본값이 아니며 길이는 운영 키와 같은 86바이트다.
 */
public final class TestJwtSecrets {

    public static final String ACCEPTABLE =
            "t49-test-jwt-key-not-production-use-86b-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

    private TestJwtSecrets() {
    }
}
