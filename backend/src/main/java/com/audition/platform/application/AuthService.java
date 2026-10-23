package com.audition.platform.application;

import com.audition.platform.api.dto.AuthMeDataDto;
import com.audition.platform.api.dto.AuthResponse;
import com.audition.platform.api.dto.LoginRequest;
import com.audition.platform.api.dto.SignupRequest;
import com.audition.platform.application.me.MeApiMapping;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.org.AgencySignupService;
import com.audition.platform.application.recovery.AuthRecoveryService;
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
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {
    private static final Set<String> ALLOWED_ROLES = Set.of("APPLICANT", "AGENCY");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserNicknameService userNicknameService;
    private final AuthRecoveryService authRecoveryService;
    private final CreditService creditService;
    private final AgencySignupService agencySignupService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       UserNicknameService userNicknameService,
                       AuthRecoveryService authRecoveryService,
                       CreditService creditService,
                       AgencySignupService agencySignupService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userNicknameService = userNicknameService;
        this.authRecoveryService = authRecoveryService;
        this.creditService = creditService;
        this.agencySignupService = agencySignupService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
        String requested = req.getRole().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(requested)) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Role must be APPLICANT or AGENCY");
        }
        agencySignupService.requireAgencyCountry(requested, req.getCountryCode());
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
        user = userRepository.save(user);
        agencySignupService.openApplication(user, requested, req.getCountryCode(), req.getName());
        creditService.grantSignupRewardIfEnabled(user.getId());
        String recoveryCode = authRecoveryService.issueNewCode(user);
        String token = jwtService.createToken(user.getId(), user.getEmail(), user.getRole());
        AuthResponse res = authResponse(token, user);
        res.setRecoveryCode(recoveryCode);
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
        String token = jwtService.createToken(user.getId(), user.getEmail(), user.getRole());
        return authResponse(token, user);
    }

    /** 같은 로그인 세션에서 DB에 반영된 접근 역할로 토큰을 다시 발급한다. */
    public AuthResponse refreshSession() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자를 찾을 수 없습니다."));
        String token = jwtService.createToken(user.getId(), user.getEmail(), user.getRole());
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
