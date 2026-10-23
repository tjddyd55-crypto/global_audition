package com.audition.platform.infra;

import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthFilterTest {

    private final UserRepository users = mock(UserRepository.class);
    private final JwtService server = new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L);
    private final JwtAuthFilter filter = new JwtAuthFilter(server, users);

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void activeUserKeepsDatabaseRole() throws Exception {
        User user = activeUser("APPLICANT");
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        apply(server.createToken(user.getId(), user.getEmail(), "SUPER_ADMIN"));
        assertEquals("ROLE_APPLICANT", authority());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, SuperAdminAuthHelper::requireSuperAdmin);
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void missingUserExpiredNoneAndBadSignatureAreUnauthorized() throws Exception {
        UUID missing = UUID.randomUUID();
        when(users.findById(missing)).thenReturn(Optional.empty());
        apply(server.createToken(missing, "ghost@local.test", "SUPER_ADMIN"));
        assertStatus(401);

        SecurityContextHolder.clearContext();
        User user = activeUser("SUPER_ADMIN");
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        apply(new JwtService(TestJwtSecrets.ACCEPTABLE, -60_000L).createToken(user.getId(), user.getEmail(), "SUPER_ADMIN"));
        assertStatus(401);

        SecurityContextHolder.clearContext();
        apply(noneToken(user.getId()));
        assertStatus(401);

        SecurityContextHolder.clearContext();
        SecretKey other = Keys.hmacShaKeyFor((TestJwtSecrets.ACCEPTABLE + "-other").getBytes(StandardCharsets.UTF_8));
        String foreign = Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", "SUPER_ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(other, Jwts.SIG.HS512)
                .compact();
        apply(foreign);
        assertStatus(401);
    }

    @Test
    void retiredDefaultAndInactiveUserAreUnauthorized() throws Exception {
        String retired = historical();
        SecretKey key = Keys.hmacShaKeyFor(retired.getBytes(StandardCharsets.UTF_8));
        User user = activeUser("SUPER_ADMIN");
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        String forged = Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", "SUPER_ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(key)
                .compact();
        apply(forged);
        assertStatus(401);

        SecurityContextHolder.clearContext();
        user.setAccountStatus("SUSPENDED");
        apply(server.createToken(user.getId(), user.getEmail(), "SUPER_ADMIN"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertStatus(401);

        SecurityContextHolder.clearContext();
        user.setAccountStatus("DELETED");
        apply(server.createToken(user.getId(), user.getEmail(), user.getRole()));
        assertStatus(401);
    }

    private void assertStatus(int status) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, SuperAdminAuthHelper::requireSuperAdmin);
        assertEquals(status, ex.getStatusCode().value());
    }

    private String authority() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority();
    }

    private void apply(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/admin/payment-orders");
        request.addHeader("Authorization", "Bearer " + token);
        FilterChain chain = (req, res) -> {
        };
        filter.doFilter(request, new MockHttpServletResponse(), chain);
    }

    private static User activeUser(String role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(role.toLowerCase() + "@local.test");
        user.setRole(role);
        user.setAccountStatus("ACTIVE");
        return user;
    }

    private static String historical() throws Exception {
        java.nio.file.Path dir = java.nio.file.Path.of("").toAbsolutePath();
        while (dir != null && !java.nio.file.Files.exists(dir.resolve(".git"))) {
            dir = dir.getParent();
        }
        Process process = new ProcessBuilder("git", "show", "3aaf471:backend/src/main/resources/application.yml")
                .directory(dir.toFile())
                .redirectError(ProcessBuilder.Redirect.DISCARD)
                .start();
        String yaml = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) {
            throw new AssertionError("historical jwt config could not be read");
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\$\\{JWT_SECRET:([^}]+)}").matcher(yaml);
        if (!matcher.find()) {
            throw new AssertionError("historical jwt placeholder was empty");
        }
        return matcher.group(1);
    }

    private static String noneToken(UUID userId) {
        Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
        String header = enc.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
        String payload = enc.encodeToString(
                ("{\"sub\":\"" + userId + "\",\"role\":\"SUPER_ADMIN\"}").getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".";
    }
}
