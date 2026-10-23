package com.audition.platform.infra;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtSecretPolicyTest {

    private final ApplicationContextRunner guard = new ApplicationContextRunner()
            .withUserConfiguration(JwtSecretGuard.class);

    @Test
    void rejectsMissingWeakAndRetiredSecrets() {
        assertRejected(null);
        assertRejected("");
        assertRejected("   ");
        assertRejected("a".repeat(31));
        assertRejected(JwtSecretPolicy.retiredForTest());
        assertRejected("  " + JwtSecretPolicy.retiredForTest() + "  ");
        assertEquals(TestJwtSecrets.ACCEPTABLE, JwtSecretPolicy.requireAcceptable(TestJwtSecrets.ACCEPTABLE));
        assertEquals("a".repeat(32), JwtSecretPolicy.requireAcceptable("  " + "a".repeat(32) + " "));
    }

    @Test
    void jwtServiceRefusesToStartWithThoseSecrets() {
        assertThrows(IllegalStateException.class, () -> new JwtService(null, 60_000L));
        assertThrows(IllegalStateException.class, () -> new JwtService("", 60_000L));
        assertThrows(IllegalStateException.class, () -> new JwtService("a".repeat(31), 60_000L));
        IllegalStateException retired = assertThrows(
                IllegalStateException.class,
                () -> new JwtService(JwtSecretPolicy.retiredForTest(), 60_000L));
        assertSafeRejection(retired);
    }

    @Test
    void springGuardFailsStartupWithoutAnAcceptableSecret() {
        guard.run(ctx -> {
            if (ctx.getStartupFailure() == null) {
                throw new AssertionError("missing JWT_SECRET should fail startup");
            }
            assertSafeRejection(ctx.getStartupFailure());
        });
        guard.withPropertyValues("app.jwt.secret=").run(ctx -> {
            if (ctx.getStartupFailure() == null) {
                throw new AssertionError("blank JWT_SECRET should fail startup");
            }
        });
        guard.withPropertyValues("app.jwt.secret=" + "b".repeat(31)).run(ctx -> {
            if (ctx.getStartupFailure() == null) {
                throw new AssertionError("short JWT_SECRET should fail startup");
            }
        });
        guard.withPropertyValues("app.jwt.secret=" + JwtSecretPolicy.retiredForTest()).run(ctx -> {
            if (ctx.getStartupFailure() == null) {
                throw new AssertionError("retired JWT_SECRET should fail startup");
            }
            assertSafeRejection(ctx.getStartupFailure());
        });
        guard.withPropertyValues("app.jwt.secret=" + TestJwtSecrets.ACCEPTABLE).run(ctx -> {
            if (ctx.getStartupFailure() != null) {
                throw new AssertionError("acceptable test JWT_SECRET should start");
            }
        });
    }

    @Test
    void tokenSignedWithRetiredDefaultIsRejectedAfterKeyChange() {
        JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L);
        String forged = sign(JwtSecretPolicy.retiredForTest(), UUID.randomUUID(), "SUPER_ADMIN", 60_000L);
        assertThrows(JwtException.class, () -> server.parseToken(forged));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L);
        JwtService otherEnv = new JwtService(TestJwtSecrets.ACCEPTABLE + "-other-env", 60_000L);
        String token = otherEnv.createToken(UUID.randomUUID(), "a@b.c", "SUPER_ADMIN");
        assertThrows(JwtException.class, () -> server.parseToken(token));
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, -60_000L);
        String token = server.createToken(UUID.randomUUID(), "a@b.c", "SUPER_ADMIN");
        assertThrows(JwtException.class, () -> server.parseToken(token));
    }

    @Test
    void algNoneIsRejected() {
        JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L);
        UUID userId = UUID.randomUUID();
        Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
        String header = enc.encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = enc.encodeToString(
                ("{\"sub\":\"" + userId + "\",\"role\":\"SUPER_ADMIN\"}").getBytes(StandardCharsets.UTF_8));
        String token = header + "." + payload + ".";
        assertThrows(JwtException.class, () -> server.parseToken(token));
    }

    @Test
    void runtimeConfigHasNoDefaultSecretAndDisablesLegacyCharge() throws Exception {
        String main = Files.readString(config("src/main/resources/application.yml"));
        String test = Files.readString(config("src/test/resources/application.yml"));
        if (main.contains(JwtSecretPolicy.retiredForTest()) || test.contains(JwtSecretPolicy.retiredForTest())) {
            throw new AssertionError("config still contains the retired JWT default");
        }
        assertTrue(main.contains("secret: \"${JWT_SECRET:}\""));
        assertTrue(main.contains("APP_ALLOW_LEGACY_CREDIT_CHARGE:false"));
        assertTrue(!main.contains("APP_ALLOW_LEGACY_CREDIT_CHARGE:true"));
        assertTrue(test.contains("secret: " + TestJwtSecrets.ACCEPTABLE));
        assertEquals(TestJwtSecrets.ACCEPTABLE, JwtSecretPolicy.requireAcceptable(TestJwtSecrets.ACCEPTABLE));
    }

    private static void assertRejected(String secret) {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> JwtSecretPolicy.requireAcceptable(secret));
        assertSafeRejection(ex);
    }

    private static void assertSafeRejection(Throwable error) {
        Throwable current = error;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && message.contains(JwtSecretPolicy.retiredForTest())) {
                throw new AssertionError("rejection leaked the retired JWT default");
            }
            current = current.getCause();
        }
        assertEquals(JwtSecretPolicy.REJECTION_MESSAGE, error instanceof IllegalStateException
                ? error.getMessage()
                : findRejection(error).getMessage());
    }

    private static IllegalStateException findRejection(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof IllegalStateException illegal
                    && JwtSecretPolicy.REJECTION_MESSAGE.equals(illegal.getMessage())) {
                return illegal;
            }
            current = current.getCause();
        }
        throw new AssertionError("startup failure was not the JWT secret rejection");
    }

    private static String sign(String secret, UUID userId, String role, long ttlMs) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", "forged@local.test")
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMs))
                .signWith(key)
                .compact();
    }

    private static Path config(String relative) {
        Path local = Path.of(relative);
        if (Files.exists(local)) {
            return local;
        }
        Path fromRepo = Path.of("backend").resolve(relative);
        if (Files.exists(fromRepo)) {
            return fromRepo;
        }
        throw new AssertionError("missing config " + relative);
    }
}
