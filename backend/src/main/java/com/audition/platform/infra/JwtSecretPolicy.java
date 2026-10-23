package com.audition.platform.infra;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.MacAlgorithm;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * HS256 이상 서명 키. 비어 있거나 32바이트 미만이거나 저장소에 있던 코드 기본값이면 기동을 거부한다.
 * 기본값 원문은 저장하지 않고 SHA-256만 비교한다.
 * 서명은 키 바이트 길이가 jjwt signWith(SecretKey) 에서 고르던 HMAC과 같은 알고리즘으로 고정한다.
 */
public final class JwtSecretPolicy {

    public static final int MIN_UTF8_BYTES = 32;

    public static final String REJECTION_MESSAGE =
            "JWT_SECRET is missing, shorter than 32 bytes, or a retired default.";

    static final String RETIRED_SHA256 = "70ce9c46f82616c940a396dd2df6021bb9ac2ce9269d9124b60c51ee809d28fe";

    private JwtSecretPolicy() {
    }

    public static String requireAcceptable(String raw) {
        if (raw == null) {
            throw rejected();
        }
        String secret = raw.trim();
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secret.isEmpty() || bytes.length < MIN_UTF8_BYTES || retiredDefault(secret)) {
            throw rejected();
        }
        return secret;
    }

    /**
     * jjwt 0.12 signWith(SecretKey) 와 같다.
     * 256비트 이상 384 미만 HS256, 384 이상 512 미만 HS384, 512 이상 HS512.
     */
    public static MacAlgorithm hmacAlgorithm(String acceptedSecret) {
        int bits = acceptedSecret.getBytes(StandardCharsets.UTF_8).length * 8;
        if (bits >= 512) {
            return Jwts.SIG.HS512;
        }
        if (bits >= 384) {
            return Jwts.SIG.HS384;
        }
        return Jwts.SIG.HS256;
    }

    public static boolean retiredDefault(String secret) {
        if (secret == null) {
            return false;
        }
        byte[] actual = sha256(secret.trim().getBytes(StandardCharsets.UTF_8));
        byte[] expected = HexFormat.of().parseHex(RETIRED_SHA256);
        return MessageDigest.isEqual(actual, expected);
    }

    private static byte[] sha256(byte[] value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private static IllegalStateException rejected() {
        return new IllegalStateException(REJECTION_MESSAGE);
    }
}
