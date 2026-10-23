package com.audition.platform.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 서명 키를 읽는 빈이 느슨해도 컨텍스트 생성 시점에 기동을 막는다.
 */
@Component
public class JwtSecretGuard {

    public JwtSecretGuard(@Value("${app.jwt.secret:}") String secret) {
        JwtSecretPolicy.requireAcceptable(secret);
    }
}
