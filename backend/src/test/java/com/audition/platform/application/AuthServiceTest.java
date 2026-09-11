package com.audition.platform.application;

import com.audition.platform.api.dto.AuthResponse;
import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.recovery.AuthRecoveryService;
import com.audition.platform.application.user.UserNicknameService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private UserNicknameService userNicknameService;
    private AuthRecoveryService authRecoveryService;
    private AuthService authService;
    private BCryptPasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userNicknameService = mock(UserNicknameService.class);
        authRecoveryService = mock(AuthRecoveryService.class);
        CreditService creditService = mock(CreditService.class);
        encoder = new BCryptPasswordEncoder();
        JwtService jwtService = new JwtService("change-me-in-production-min-32-chars!!", 86_400_000L);
        authService = new AuthService(userRepository, encoder, jwtService, userNicknameService, authRecoveryService, creditService);
        when(userRepository.existsByUsername(any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            return user;
        });
    }

    @Test
    void signupIssuesRecoveryCodeOnce() {
        SignupRequest req = new SignupRequest();
        req.setEmail("new@example.com");
        req.setPassword("secret1");
        req.setRole("APPLICANT");
        req.setNickname("새닉네임");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userNicknameService.prepareNicknameOrThrow(eq("새닉네임"), isNull())).thenReturn("새닉네임");
        when(authRecoveryService.issueNewCode(any(User.class))).thenReturn("ABCD-2345-EFGH");

        AuthResponse res = authService.signup(req);
        assertEquals("APPLICANT", res.getRole());
        assertEquals("ABCD-2345-EFGH", res.getRecoveryCode());
        assertNotNull(res.getToken());
        assertEquals("new@example.com", res.getEmail());
    }

    @Test
    void loginRejectsWrongPassword() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("a@example.com");
        user.setRole("APPLICANT");
        user.setPasswordHash(encoder.encode("correct"));
        when(userRepository.findByEmail("a@example.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest();
        req.setEmail("a@example.com");
        req.setPassword("wrong");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> authService.login(req));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void loginSuccessDoesNotReturnRecoveryCode() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("a@example.com");
        user.setRole("APPLICANT");
        user.setPasswordHash(encoder.encode("correct"));
        when(userRepository.findByEmail("a@example.com")).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest();
        req.setEmail("a@example.com");
        req.setPassword("correct");
        AuthResponse res = authService.login(req);
        assertNotNull(res.getToken());
        assertNull(res.getRecoveryCode());
    }
}
