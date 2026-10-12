package com.audition.platform.application.recovery;

import com.audition.platform.domain.recovery.RecoveryCodeFormatter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;

/**
 * 복구 코드 저장: HMAC lookup + BCrypt hash. 평문은 저장하지 않는다.
 * pepper는 새 시크릿을 만들지 않고 기존 JWT secret을 재사용한다.
 */
@Component
public class RecoveryCodeCrypto {

    private final PasswordEncoder passwordEncoder;
    private final byte[] pepper;

    public RecoveryCodeCrypto(
            PasswordEncoder passwordEncoder,
            @Value("${app.jwt.secret}") String jwtSecret) {
        this.passwordEncoder = passwordEncoder;
        this.pepper = jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String normalize(String raw) {
        return RecoveryCodeFormatter.normalize(raw);
    }

    public String lookupKey(String normalized) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(pepper, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(normalized.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("복구 코드 lookup 키를 만들 수 없습니다.", e);
        }
    }

    public String hash(String normalized) {
        return passwordEncoder.encode(normalized);
    }

    public boolean matches(String normalized, String hash) {
        return hash != null && passwordEncoder.matches(normalized, hash);
    }
}
