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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtSecretPolicyTest {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\$\\{JWT_SECRET:([^}]*)}");

    private final ApplicationContextRunner guard = new ApplicationContextRunner()
            .withUserConfiguration(JwtSecretGuard.class);

    @Test
    void rejectsMissingWeakAndRetiredSecrets() throws Exception {
        assertRejected(null);
        assertRejected("");
        assertRejected("   ");
        assertRejected("a".repeat(31));
        String retired = historicalDefault();
        assertRejected(retired);
        assertRejected("  " + retired + "  ");
        assertTrue(JwtSecretPolicy.retiredDefault(retired));
        assertFalse(retiredMessage(retired).contains(retired));
        assertEquals(TestJwtSecrets.ACCEPTABLE, JwtSecretPolicy.requireAcceptable(TestJwtSecrets.ACCEPTABLE));
        assertEquals(86, TestJwtSecrets.ACCEPTABLE.getBytes(StandardCharsets.UTF_8).length);
    }

    @Test
    void springGuardFailsStartupForMissingWeakAndRetiredSecrets() throws Exception {
        assertStartupFails(guard);
        assertStartupFails(guard.withPropertyValues("app.jwt.secret="));
        assertStartupFails(guard.withPropertyValues("app.jwt.secret=" + "b".repeat(31)));
        assertStartupFails(guard.withPropertyValues("app.jwt.secret=" + historicalDefault()));
        guard.withPropertyValues("app.jwt.secret=" + TestJwtSecrets.ACCEPTABLE).run(ctx -> {
            if (ctx.getStartupFailure() != null) {
                throw new AssertionError("acceptable JWT secret should start");
            }
        });
    }

    @Test
    void pinsHmacToTheAlgorithmJjwtWouldChooseAndAcceptsLegacyTokens() {
        assertCompatible("k".repeat(32), "HS256");
        assertCompatible("k".repeat(48), "HS384");
        assertCompatible("k".repeat(64), "HS512");
        assertCompatible("k".repeat(86), "HS512");
    }

    @Test
    void rejectsNoneExpiredAndWrongAlgorithm() {
        JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L);
        UUID userId = UUID.randomUUID();
        assertThrows(JwtException.class, () -> server.parseToken(noneToken(userId)));
        JwtService expired = new JwtService(TestJwtSecrets.ACCEPTABLE, -60_000L);
        assertThrows(JwtException.class, () -> server.parseToken(
                expired.createToken(userId, "a@b.c", "APPLICANT")));
        SecretKey key = Keys.hmacShaKeyFor(TestJwtSecrets.ACCEPTABLE.getBytes(StandardCharsets.UTF_8));
        String wrongAlg = Jwts.builder()
                .subject(userId.toString())
                .claim("role", "SUPER_ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
        assertEquals("HS256", JwtService.headerAlg(wrongAlg));
        assertThrows(JwtException.class, () -> server.parseToken(wrongAlg));
        String valid = server.createToken(userId, "a@b.c", "APPLICANT");
        String tampered = valid.substring(0, valid.length() - 2) + "aa";
        assertThrows(JwtException.class, () -> server.parseToken(tampered));
    }

    @Test
    void runtimeYamlHasNoEmbeddedDefault() throws Exception {
        String retired = historicalDefault();
        String yaml = Files.readString(Path.of("src/main/resources/application.yml"));
        if (yaml.contains(retired)) {
            throw new AssertionError("application.yml still embeds the retired JWT default");
        }
        assertTrue(yaml.contains("secret: \"${JWT_SECRET:}\""));
        assertTrue(yaml.contains("APP_ALLOW_LEGACY_CREDIT_CHARGE:false"));
        assertFalse(yaml.contains("APP_ALLOW_LEGACY_CREDIT_CHARGE:true"));
    }

    private static void assertCompatible(String secret, String expectedAlg) {
        UUID userId = UUID.randomUUID();
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        String legacy = Jwts.builder()
                .subject(userId.toString())
                .claim("email", "a@b.c")
                .claim("role", "SUPER_ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(key)
                .compact();
        JwtService server = new JwtService(secret, 60_000L);
        assertEquals(expectedAlg, server.expectedAlgorithmId());
        assertEquals(expectedAlg, JwtService.headerAlg(legacy));
        assertEquals(userId.toString(), server.parseToken(legacy).getSubject());
        String fresh = server.createToken(userId, "a@b.c", "APPLICANT");
        assertEquals(expectedAlg, JwtService.headerAlg(fresh));
        assertEquals("APPLICANT", server.parseToken(fresh).get("role", String.class));
    }

    private static void assertRejected(String secret) {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class, () -> JwtSecretPolicy.requireAcceptable(secret));
        assertEquals(JwtSecretPolicy.REJECTION_MESSAGE, ex.getMessage());
        if (secret != null && ex.getMessage().contains(secret.trim()) && !secret.isBlank()) {
            throw new AssertionError("rejection leaked the candidate secret");
        }
    }

    private static String retiredMessage(String retired) {
        return assertThrows(IllegalStateException.class, () -> new JwtService(retired, 60_000L)).getMessage();
    }

    private static void assertStartupFails(ApplicationContextRunner runner) {
        runner.run(ctx -> {
            if (ctx.getStartupFailure() == null) {
                throw new AssertionError("startup should reject the JWT secret");
            }
            if (!containsRejection(ctx.getStartupFailure())) {
                throw new AssertionError("startup failure was not the JWT secret rejection");
            }
        });
    }

    private static boolean containsRejection(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (JwtSecretPolicy.REJECTION_MESSAGE.equals(current.getMessage())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    static String historicalDefault() throws Exception {
        Path dir = Path.of("").toAbsolutePath();
        while (dir != null && !Files.exists(dir.resolve(".git"))) {
            dir = dir.getParent();
        }
        if (dir == null) {
            throw new AssertionError("git checkout not found");
        }
        Process process = new ProcessBuilder("git", "show", "3aaf471:backend/src/main/resources/application.yml")
                .directory(dir.toFile())
                .redirectError(ProcessBuilder.Redirect.DISCARD)
                .start();
        String yaml = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) {
            throw new AssertionError("historical jwt config could not be read");
        }
        Matcher matcher = PLACEHOLDER.matcher(yaml);
        if (!matcher.find() || matcher.group(1).isBlank()) {
            throw new AssertionError("historical jwt placeholder was empty");
        }
        return matcher.group(1);
    }

    private static String noneToken(UUID userId) {
        Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
        String header = enc.encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = enc.encodeToString(
                ("{\"sub\":\"" + userId + "\",\"role\":\"SUPER_ADMIN\"}").getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".";
    }
}
