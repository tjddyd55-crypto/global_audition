package com.audition.platform.application;

import com.audition.platform.application.points.PointsService;
import com.audition.platform.api.dto.AuthMeDataDto;
import com.audition.platform.api.dto.AuthResponse;
import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.consent.ConsentService;
import com.audition.platform.application.consent.MinorPolicyService;
import com.audition.platform.application.consent.ProfileCodes;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.org.AgencySignupProfile;
import com.audition.platform.application.org.AgencySignupService;
import com.audition.platform.application.recovery.AuthRecoveryService;
import com.audition.platform.application.user.ApplicantSignupProfileService;
import com.audition.platform.application.user.UserNicknameService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.JwtService;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {
    private final PointsService points;
    private static final Set<String> ALLOWED_ROLES = Set.of("APPLICANT", "AGENCY");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserNicknameService userNicknameService;
    private final AuthRecoveryService authRecoveryService;
    private final CreditService creditService;
    private final AgencySignupService agencySignupService;
    private final ApplicantSignupProfileService applicantSignupProfileService;
    private final ConsentService consentService;
    private final MinorPolicyService minorPolicyService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserNicknameService userNicknameService,
                       AuthRecoveryService authRecoveryService,
                       CreditService creditService,
                       AgencySignupService agencySignupService,
                       ApplicantSignupProfileService applicantSignupProfileService,
                       ConsentService consentService,
                       MinorPolicyService minorPolicyService,
            PointsService points) {
        this.points = points;
        this.consentService = consentService;
        this.minorPolicyService = minorPolicyService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userNicknameService = userNicknameService;
        this.authRecoveryService = authRecoveryService;
        this.creditService = creditService;
        this.agencySignupService = agencySignupService;
        this.applicantSignupProfileService = applicantSignupProfileService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
        String requested = req.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(requested)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Role must be APPLICANT or AGENCY");
        }
        agencySignupService.requireAgencyCountry(requested, req.getCountryCode());
        boolean applicant = "APPLICANT".equals(requested);
        if (req.getAgreeTerms() == null && req.getAgreePrivacyCollection() == null) {
            // 동의 필드를 모르는 예전 앱/화면. 사용자에게 그대로 보이는 문장으로 업데이트를 안내한다.
            throw new ResponseStatusException(HttpStatus.UPGRADE_REQUIRED,
                    "앱을 최신 버전으로 업데이트해 주세요. Please update the app to the latest version.");
        }
        ConsentService.SignupConsents signupConsents = new ConsentService.SignupConsents(
                Boolean.TRUE.equals(req.getAgreeTerms()), Boolean.TRUE.equals(req.getAgreePrivacyCollection()),
                Boolean.TRUE.equals(req.getAgreePrivacyDisclosure()), Boolean.TRUE.equals(req.getAgreeMarketing()));
        ConsentService.requireSignup(signupConsents, applicant);
        LocalDate birthDate = ProfileCodes.birthDate(req.getBirthDate());
        if (applicant && birthDate == null) {
            // 국가별 미성년자 정책 판정에 필요하다. 미성년자라는 이유로 가입을 막지는 않는다.
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "BIRTH_DATE_REQUIRED");
        }
        String gender = applicant ? ProfileCodes.signupGender(req.getGender()) : ProfileCodes.gender(req.getGender());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        // 기획사 신청이어도 본사 승인 전에는 운영 역할을 주지 않는다.
        String accessRole = "AGENCY".equals(requested) ? "APPLICANT" : requested;
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(accessRole);
        user.setSignupIntent(requested);
        user.setUpdatedAt(Instant.now());
        String local = extractLocalPart(email);
        user.setUsername(uniqueUsername(local));
        user.setNickname(userNicknameService.prepareNicknameOrThrow(req.getNickname(), null));
        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        applicantSignupProfileService.apply(user, requested, req.getCountryCode(), req.getTimezone());
        user.setBirthDate(birthDate);
        // 신규 회원: 선택 공개 항목은 모두 비공개(기본 OFF)로 시작한다. 기존 회원의 예전 기본값은 건드리지 않는다.
        user.setChannelShownFields(new String[0]);
        if (gender != null && !gender.isEmpty()) {
            user.setGender(gender);
        }
        // 신규 회원: 인재 검색 노출·캐스팅 제안 수신은 기본 OFF(엔티티 기본값). 회원이 설정에서 켠다.
        user = userRepository.save(user);
        // 동의 기록은 JDBC 로 쓰므로 회원 행을 먼저 반영한다(FK).
        userRepository.flush();
        consentService.recordSignup(user.getId(), signupConsents);
        if (applicant && req.getInviteCode() != null) points.registerReferral(user.getId(), req.getInviteCode());
        agencySignupService.openApplication(user, requested, AgencySignupProfile.fromSignup(
                req.getCountryCode(),
                req.getCompanyName(),
                req.getLegalName(),
                req.getName(),
                req.getBusinessRegistrationNumber(),
                req.getRepresentativeName(),
                req.getContactEmail(),
                req.getContactPhone(),
                req.getWebsite(),
                req.getBusinessCity(),
                req.getTaxId(),
                req.getBusinessAddress(),
                req.getEstablishedYear(),
                req.getBusinessLicenseDocumentUrl()));
        creditService.grantSignupRewardIfEnabled(user.getId());
        String recoveryCode = authRecoveryService.issueNewCode(user);
        String token = createSessionToken(user);
        AuthResponse res = authResponse(token, user);
        res.setRecoveryCode(recoveryCode);
        MinorPolicyService.Status minor = applicant ? minorPolicyService.status(user) : null;
        res.setGuardianRequired(minor != null && minor.guardianLegallyRequired());
        return res;
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        // PR #67: 비활성·삭제 계정은 로그인 불가.
        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "계정이 활성 상태가 아닙니다.");
        }
        String token = createSessionToken(user);
        return authResponse(token, user);
    }

    private String createSessionToken(User user) {
        UUID version = user.getBootstrapCredentialVersion();
        return version == null
                ? jwtService.createToken(user.getId(), user.getEmail(), user.getRole())
                : jwtService.createToken(user.getId(), user.getEmail(), user.getRole(), version);
    }

    /** 같은 로그인 세션에서 DB에 반영된 접근 역할로 토큰을 다시 발급한다. */
    public AuthResponse refreshSession() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        String token = createSessionToken(user);
        return authResponse(token, user);
    }

    private static AuthResponse authResponse(String token, User user) {
        AuthResponse res = new AuthResponse(token, user.getRole(), user.getId().toString());
        res.setSignupIntent(user.getSignupIntent());
        res.setEmail(user.getEmail());
        res.setNickname(user.getNickname());
        res.setProfileImageUrl(user.getProfileImageUrl());
        return res;
    }

    public AuthMeDataDto meData() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        AuthMeDataDto d = new AuthMeDataDto();
        d.setId(user.getId().toString());
        d.setEmail(user.getEmail());
        d.setUsername(user.getUsername());
        d.setNickname(user.getNickname());
        d.setName(user.getName());
        d.setDisplayName(user.getPublicDisplayLabel());
        d.setRole(MeApiMapping.userRoleToApi(user.getRole()));
        d.setProfileImageUrl(user.getProfileImageUrl());
        d.setCountryCode(user.getCountryCode());
        d.setTimezone(user.getTimezone());
        return d;
    }

    private static String extractLocalPart(String email) {
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : "user";
    }

    private String uniqueUsername(String localPart) {
        String sanitized = localPart.replaceAll("[^a-zA-Z0-9_]", "_");
        if (sanitized.isEmpty()) {
            sanitized = "user";
        }
        String candidate = sanitized + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        while (userRepository.existsByUsername(candidate)) {
            candidate = sanitized + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        }
        return candidate;
    }

}
