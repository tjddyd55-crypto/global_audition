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
    void retiredDefaultAdminTokenIsUnauthorized() throws Exception {
        String token = sign(JwtSecretPolicy.retiredForTest(), UUID.randomUUID(), "SUPER_ADMIN");
        apply(token);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, SuperAdminAuthHelper::requireSuperAdmin);
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void otherKeyAndExpiredAndAlgNoneAreUnauthorized() throws Exception {
        JwtService other = new JwtService(TestJwtSecrets.ACCEPTABLE + "-other-env", 60_000L);
        apply(other.createToken(UUID.randomUUID(), "a@b.c", "SUPER_ADMIN"));
        assertStatus(401);

        SecurityContextHolder.clearContext();
        JwtService expired = new JwtService(TestJwtSecrets.ACCEPTABLE, -60_000L);
        apply(expired.createToken(UUID.randomUUID(), "a@b.c", "SUPER_ADMIN"));
        assertStatus(401);

        SecurityContextHolder.clearContext();
        apply(noneToken(UUID.randomUUID()));
        assertStatus(401);
    }

    @Test
    void roleClaimCannotElevateAboveDatabaseRole() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setRole("APPLICANT");
        when(users.findById(userId)).thenReturn(Optional.of(user));

        apply(server.createToken(userId, "fan@local.test", "SUPER_ADMIN"));
        assertEquals(
                "ROLE_APPLICANT",
                SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, SuperAdminAuthHelper::requireSuperAdmin);
        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void signedTokenForUnknownUserIsUnauthorized() throws Exception {
        UUID userId = UUID.randomUUID();
        when(users.findById(userId)).thenReturn(Optional.empty());
        apply(server.createToken(userId, "ghost@local.test", "SUPER_ADMIN"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertStatus(401);
    }

    private void assertStatus(int status) {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, SuperAdminAuthHelper::requireSuperAdmin);
        assertEquals(status, ex.getStatusCode().value());
    }

    private void apply(String token) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/admin/payment-providers");
        request.addHeader("Authorization", "Bearer " + token);
        FilterChain chain = (req, res) -> {
        };
        filter.doFilter(request, new MockHttpServletResponse(), chain);
    }

    private static String sign(String secret, UUID userId, String role) {
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(key)
                .compact();
    }

    private static String noneToken(UUID userId) {
        java.util.Base64.Encoder enc = java.util.Base64.getUrlEncoder().withoutPadding();
        String header = enc.encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = enc.encodeToString(
                ("{\"sub\":\"" + userId + "\",\"role\":\"SUPER_ADMIN\"}").getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".";
    }
}
