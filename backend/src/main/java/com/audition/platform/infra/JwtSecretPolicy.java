package com.audition.platform.infra;

import java.nio.charset.StandardCharsets;

/**
 * HS256 서명 키. 비어 있거나 32바이트 미만이거나 저장소에 있던 코드 기본값이면 기동을 거부한다.
 * 환경 구분은 환경마다 다른 JWT_SECRET 으로 한다.
 */
public final class JwtSecretPolicy {

    public static final int MIN_UTF8_BYTES = 32;

    public static final String REJECTION_MESSAGE =
            "JWT_SECRET is missing, shorter than 32 bytes, or a retired default.";

    private static final String RETIRED_CODE_DEFAULT = "change-me-in-production-min-32-chars";

    private JwtSecretPolicy() {
    }

    public static String requireAcceptable(String raw) {
        if (raw == null) {
            throw rejected();
        }
        String secret = raw.trim();
        if (secret.isEmpty()
                || secret.getBytes(StandardCharsets.UTF_8).length < MIN_UTF8_BYTES
                || secret.equals(RETIRED_CODE_DEFAULT)) {
            throw rejected();
        }
        return secret;
    }

    /** 테스트가 퇴역 값으로 서명할 때만 사용한다. 로그·메시지에 넣지 않는다. */
    public static String retiredForTest() {
        return RETIRED_CODE_DEFAULT;
    }

    private static IllegalStateException rejected() {
        return new IllegalStateException(REJECTION_MESSAGE);
    }
}
