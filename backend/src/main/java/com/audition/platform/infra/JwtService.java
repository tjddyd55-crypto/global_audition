package com.audition.platform.infra;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.MacAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtService {

    private static final Pattern ALG_PATTERN = Pattern.compile("\"alg\"\\s*:\\s*\"([^\"]+)\"");

    private final SecretKey key;
    private final MacAlgorithm algorithm;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        String accepted = JwtSecretPolicy.requireAcceptable(secret);
        this.algorithm = JwtSecretPolicy.hmacAlgorithm(accepted);
        this.key = Keys.hmacShaKeyFor(accepted.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String createToken(UUID userId, String email, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key, algorithm)
                .compact();
    }

    public Claims parseToken(String token) {
        String alg = headerAlg(token);
        if (alg == null || !algorithm.getId().equals(alg) || !alg.startsWith("HS")) {
            throw new JwtException("JWT algorithm is not accepted");
        }
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String expectedAlgorithmId() {
        return algorithm.getId();
    }

    public UUID getUserIdFromToken(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    static String headerAlg(String token) {
        if (token == null) {
            return null;
        }
        int dot = token.indexOf('.');
        if (dot <= 0) {
            return null;
        }
        try {
            String headerJson = new String(decodeUrl(token.substring(0, dot)), StandardCharsets.UTF_8);
            Matcher matcher = ALG_PATTERN.matcher(headerJson);
            return matcher.find() ? matcher.group(1) : null;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static byte[] decodeUrl(String part) {
        int pad = (4 - part.length() % 4) % 4;
        return Base64.getUrlDecoder().decode(part + "=".repeat(pad));
    }
}
