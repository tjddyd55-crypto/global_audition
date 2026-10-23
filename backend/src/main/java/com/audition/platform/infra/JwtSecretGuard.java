package com.audition.platform.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 서명 키를 읽는 빈이 하나라도 느슨하면 기동이 통과하지 않게, 컨텍스트 생성 시점에 한 번 더 검사한다.
 */
@Component
public class JwtSecretGuard {

    public JwtSecretGuard(@Value("${app.jwt.secret:}") String secret) {
        JwtSecretPolicy.requireAcceptable(secret);
    }
}
