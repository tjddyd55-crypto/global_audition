package com.audition.platform.application.recovery;

import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthRecoveryServiceTest {

    private UserRepository userRepository;
    private AuthRecoveryService service;
    private RecoveryCodeCrypto crypto;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        crypto = new RecoveryCodeCrypto(new BCryptPasswordEncoder(), "change-me-in-production-min-32-chars!!");
        service = new AuthRecoveryService(userRepository, crypto, new BCryptPasswordEncoder());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByRecoveryCodeLookup(any())).thenReturn(Optional.empty());
    }

    @Test
    void issueIdentifyResetUsesHashNotPlaintext() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("a@example.com");
        user.setPasswordHash("old-hash");

        String display = service.issueNewCode(user);
        assertTrue(display.contains("-"));
        assertNotEquals(display, user.getRecoveryCodeHash());
        assertTrue(user.getRecoveryCodeHash().startsWith("$2"));

        when(userRepository.findByRecoveryCodeLookup(user.getRecoveryCodeLookup())).thenReturn(Optional.of(user));
        assertEquals("a@example.com", service.identify(display).getAccountIdentifier());

        service.resetPassword(display, "new-pass-1");
        assertTrue(new BCryptPasswordEncoder().matches("new-pass-1", user.getPasswordHash()));
        assertNotEquals("old-hash", user.getPasswordHash());
    }

    @Test
    void wrongCodeDoesNotRevealAccount() {
        when(userRepository.findByRecoveryCodeLookup(any())).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.identify("ABCD-2345-EFGH"));
        assertEquals(404, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("복구 코드"));
    }

    @Test
    void invalidShapeIsUnprocessableWithoutLookup() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.identify("short"));
        assertEquals(422, ex.getStatusCode().value());
    }

    @Test
    void fiveFailuresLockAccount() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("a@example.com");
        user.setRecoveryCodeHash(crypto.hash(crypto.normalize("ABCD-2345-EFGH")));
        user.setRecoveryCodeLookup("lookup");
        user.setRecoveryFailedAttempts(4);
        when(userRepository.findByRecoveryCodeLookup(any())).thenReturn(Optional.of(user));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.identify("WXYZ-2345-ABCD"));
        assertEquals(404, ex.getStatusCode().value());
        assertEquals(5, user.getRecoveryFailedAttempts());
        assertTrue(user.getRecoveryLockedUntil() != null);
    }
}
