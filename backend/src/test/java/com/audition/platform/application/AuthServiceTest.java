package com.audition.platform.application;

import com.audition.platform.infra.TestJwtSecrets;

import com.audition.platform.api.dto.AuthResponse;
import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.org.AgencySignupProfile;
import com.audition.platform.application.org.AgencySignupService;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private UserNicknameService userNicknameService;
    private AuthRecoveryService authRecoveryService;
    private AuthService authService;
    private AgencySignupService agencySignupService;
    private BCryptPasswordEncoder encoder;
    private com.audition.platform.application.consent.ConsentService consentService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userNicknameService = mock(UserNicknameService.class);
        authRecoveryService = mock(AuthRecoveryService.class);
        CreditService creditService = mock(CreditService.class);
        agencySignupService = mock(AgencySignupService.class);
        encoder = new BCryptPasswordEncoder();
        JwtService jwtService = new JwtService(TestJwtSecrets.ACCEPTABLE, 86_400_000L);
        authService = new AuthService(
                userRepository, encoder, jwtService, userNicknameService, authRecoveryService, creditService, agencySignupService,
                mock(com.audition.platform.application.user.ApplicantSignupProfileService.class),
                consentService = mock(com.audition.platform.application.consent.ConsentService.class),
                mock(com.audition.platform.application.consent.MinorPolicyService.class),
                mock(com.audition.platform.application.points.PointsService.class));
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
        req.setBirthDate("2000-01-15");
        agreeAll(req);
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userNicknameService.prepareNicknameOrThrow(eq("새닉네임"), isNull())).thenReturn("새닉네임");
        when(authRecoveryService.issueNewCode(any(User.class))).thenReturn("ABCD-2345-EFGH");

        AuthResponse res = authService.signup(req);
        assertEquals("APPLICANT", res.getRole());
        assertEquals("APPLICANT", res.getSignupIntent());
        assertEquals("ABCD-2345-EFGH", res.getRecoveryCode());
        assertNotNull(res.getToken());
        assertEquals("new@example.com", res.getEmail());
        verify(agencySignupService, never()).openApplication(any(), eq("AGENCY"), any());
    }

    @Test
    void agencySignupKeepsApplicantAccessUntilHeadquartersApproval() {
        SignupRequest req = new SignupRequest();
        req.setEmail("agency@example.com");
        req.setPassword("secret1");
        req.setRole("AGENCY");
        req.setNickname("기획사닉");
        req.setName("Legacy Name");
        req.setLegalName("QA Entity");
        req.setCompanyName("GLOBAL TEST AGENCY");
        req.setBusinessRegistrationNumber("123-45-67890");
        req.setRepresentativeName("Hong Gildong");
        req.setContactPhone("010-1234-5678");
        req.setBusinessCity("Seoul");
        req.setCountryCode("JP");
        req.setAgreeTerms(true);
        req.setAgreePrivacyCollection(true);
        when(userRepository.existsByEmail("agency@example.com")).thenReturn(false);
        when(userNicknameService.prepareNicknameOrThrow(eq("기획사닉"), isNull())).thenReturn("기획사닉");
        when(authRecoveryService.issueNewCode(any(User.class))).thenReturn("CODE-2345-WXYZ");

        AuthResponse res = authService.signup(req);

        assertEquals("APPLICANT", res.getRole());
        assertEquals("AGENCY", res.getSignupIntent());
        verify(agencySignupService).requireAgencyCountry("AGENCY", "JP");
        org.mockito.ArgumentCaptor<AgencySignupProfile> profile =
                org.mockito.ArgumentCaptor.forClass(AgencySignupProfile.class);
        verify(agencySignupService).openApplication(any(User.class), eq("AGENCY"), profile.capture());
        assertEquals("JP", profile.getValue().countryCode());
        assertEquals("GLOBAL TEST AGENCY", profile.getValue().companyName());
        assertEquals("QA Entity", profile.getValue().legalName());
        assertEquals("123-45-67890", profile.getValue().businessRegistrationNumber());
        assertEquals("Hong Gildong", profile.getValue().representativeName());
        assertEquals("010-1234-5678", profile.getValue().contactPhone());
        assertEquals("Seoul", profile.getValue().businessCity());
        org.mockito.ArgumentCaptor<User> saved = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("APPLICANT", saved.getValue().getRole());
        assertEquals("AGENCY", saved.getValue().getSignupIntent());
        assertNotNull(res.getToken());
        assertEquals("agency@example.com", res.getEmail());
    }

    private static void agreeAll(SignupRequest req) {
        req.setAgreeTerms(true);
        req.setAgreePrivacyCollection(true);
        req.setAgreePrivacyDisclosure(true);
    }

    @Test
    void signupRequiresSeparatedConsentsAndBirthDateButNotAdulthood() {
        SignupRequest req = new SignupRequest();
        req.setEmail("minor@example.com");
        req.setPassword("secret1");
        req.setRole("APPLICANT");
        req.setNickname("미성년닉");
        when(userRepository.existsByEmail("minor@example.com")).thenReturn(false);
        when(userNicknameService.prepareNicknameOrThrow(eq("미성년닉"), isNull())).thenReturn("미성년닉");
        org.springframework.web.server.ResponseStatusException oldApp = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class, () -> authService.signup(req));
        assertEquals(426, oldApp.getStatusCode().value(), "동의 필드가 없는 예전 앱은 업데이트 안내");
        req.setAgreeTerms(false);
        req.setAgreePrivacyCollection(true);
        org.springframework.web.server.ResponseStatusException noConsent = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class, () -> authService.signup(req));
        assertEquals("CONSENT_REQUIRED", noConsent.getReason());
        agreeAll(req);
        org.springframework.web.server.ResponseStatusException noBirth = org.junit.jupiter.api.Assertions.assertThrows(
                org.springframework.web.server.ResponseStatusException.class, () -> authService.signup(req));
        assertEquals("BIRTH_DATE_REQUIRED", noBirth.getReason());
        req.setBirthDate(java.time.LocalDate.now().minusYears(12).toString());
        req.setGender("female");
        AuthResponse res = authService.signup(req);
        assertNotNull(res.getToken(), "미성년자도 가입할 수 있다");
        org.mockito.ArgumentCaptor<com.audition.platform.application.consent.ConsentService.SignupConsents> c =
                org.mockito.ArgumentCaptor.forClass(com.audition.platform.application.consent.ConsentService.SignupConsents.class);
        verify(consentService).recordSignup(any(UUID.class), c.capture());
        assertEquals(true, c.getValue().terms());
        assertEquals(false, c.getValue().marketing());
        // 가입 경로는 보호자 동의(GUARDIAN_CONSENT)를 기록하지 않는다.
        verify(consentService, never()).insert(any(), eq("GUARDIAN_CONSENT"), any(), any(), any());
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
