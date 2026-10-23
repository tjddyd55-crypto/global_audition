package com.audition.platform.application;

import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.user.UserNicknameService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.TestJwtSecrets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MainSecurityScopeTest {

    private UserRepository users;
    private AuthService auth;
    private BCryptPasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        UserNicknameService nicknames = mock(UserNicknameService.class);
        encoder = new BCryptPasswordEncoder();
        when(nicknames.prepareNicknameOrThrow(any(), any())).thenReturn("hotfan");
        when(users.existsByEmail(any())).thenReturn(false);
        when(users.existsByUsername(any())).thenReturn(false);
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            if (user.getId() == null) {
                user.setId(UUID.randomUUID());
            }
            return user;
        });
        auth = new AuthService(users, encoder, new JwtService(TestJwtSecrets.ACCEPTABLE, 60_000L), nicknames);
    }

    @Test
    void publicAgencySignupIsRejectedAndNothingIsSaved() {
        SignupRequest request = new SignupRequest();
        request.setEmail("agency@local.test");
        request.setPassword("Localtest1!");
        request.setRole("AGENCY");
        request.setNickname("hotfan");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> auth.signup(request));
        assertEquals(403, ex.getStatusCode().value());
        assertEquals(AuthService.AGENCY_SIGNUP_NOT_AVAILABLE, ex.getReason());
        org.mockito.Mockito.verify(users, org.mockito.Mockito.never()).save(any(User.class));
    }

    @Test
    void applicantSignupStoresApplicant() {
        SignupRequest request = new SignupRequest();
        request.setEmail("fan@local.test");
        request.setPassword("Localtest1!");
        request.setRole("applicant");
        request.setNickname("hotfan");
        auth.signup(request);
        org.mockito.Mockito.verify(users).save(org.mockito.ArgumentMatchers.argThat(user -> "APPLICANT".equals(user.getRole())));
    }

    @Test
    void inactiveLoginIsRejected() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("stop@local.test");
        user.setRole("SUPER_ADMIN");
        user.setAccountStatus("SUSPENDED");
        user.setPasswordHash(encoder.encode("Localtest1!"));
        when(users.findByEmail("stop@local.test")).thenReturn(java.util.Optional.of(user));
        LoginRequest request = new LoginRequest();
        request.setEmail("stop@local.test");
        request.setPassword("Localtest1!");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> auth.login(request));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void mainHasNoCountryScopeOrAgencyApprovalFeature() throws Exception {
        Path root = Path.of("src/main/java");
        try (Stream<Path> files = Files.walk(root)) {
            boolean found = files.filter(path -> path.toString().endsWith(".java"))
                    .map(MainSecurityScopeTest::readQuiet)
                    .anyMatch(text -> text.contains("COUNTRY_ADMIN")
                            || text.contains("AGENCY_NOT_APPROVED")
                            || text.contains("signup_intent"));
            if (found) {
                throw new AssertionError("main unexpectedly contains country scope or agency approval");
            }
        }
    }

    private static String readQuiet(Path path) {
        try {
            return Files.readString(path);
        } catch (Exception ex) {
            throw new AssertionError("could not read source");
        }
    }
}
