package com.audition.platform.application.service;

import com.audition.platform.application.dto.*;
import java.util.UUID;
import java.time.LocalDateTime;
import com.audition.platform.application.mapper.UserMapper;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.entity.BusinessProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import com.audition.platform.domain.repository.BusinessProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import com.audition.platform.infrastructure.email.EmailService;
import com.audition.platform.infrastructure.security.JwtTokenProvider;
import com.audition.platform.infrastructure.security.PasswordEncoder;
import com.audition.platform.infrastructure.social.SocialLoginService;
import com.audition.platform.infrastructure.social.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ApplicantProfileRepository applicantProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final SocialLoginService socialLoginService;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("이미 등록된 이메일입니다");
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName().trim())
                .userType(request.getUserType())
                .provider(User.Provider.LOCAL) // 일반 회원가입
                .build();

        User savedUser;
        try {
            savedUser = userRepository.save(user);
        } catch (Exception e) {
            log.error("사용자 저장 실패: {}", e.getMessage(), e);
            throw new RuntimeException("사용자 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
        
        // savedUser의 ID가 null인지 확인
        if (savedUser.getId() == null) {
            throw new RuntimeException("사용자 저장 후 ID를 가져올 수 없습니다");
        }

        // 프로필 생성
        if (request.getUserType() == User.UserType.APPLICANT) {
            // 지망생 필수 필드 검증
            if (request.getCountry() == null || request.getCountry().trim().isEmpty()) {
                throw new RuntimeException("지망생 회원가입 시 국가는 필수입니다");
            }
            if (!request.getCountry().matches("^[A-Z]{2}$")) {
                throw new RuntimeException("국가는 ISO 3166-1 alpha-2 형식이어야 합니다 (예: KR, US, JP). 입력된 값: " + request.getCountry());
            }
            if (request.getCity() == null || request.getCity().trim().isEmpty()) {
                throw new RuntimeException("지망생 회원가입 시 도시는 필수입니다");
            }
            if (request.getBirthday() == null) {
                throw new RuntimeException("지망생 회원가입 시 생년월일은 필수입니다");
            }

            String languagesStr = null;
            if (request.getLanguages() != null && !request.getLanguages().isEmpty()) {
                languagesStr = String.join(",", request.getLanguages());
            }

            // 빈 문자열을 null로 변환하는 헬퍼
            String timezoneValue = request.getTimezone();
            if (timezoneValue != null && timezoneValue.trim().isEmpty()) {
                timezoneValue = null;
            } else if (timezoneValue != null) {
                timezoneValue = timezoneValue.trim();
            }
            
            String phoneValue = request.getPhone();
            if (phoneValue != null && phoneValue.trim().isEmpty()) {
                phoneValue = null;
            } else if (phoneValue != null) {
                phoneValue = phoneValue.trim();
            }
            
            String addressValue = request.getAddress();
            if (addressValue != null && addressValue.trim().isEmpty()) {
                addressValue = null;
            } else if (addressValue != null) {
                addressValue = addressValue.trim();
            }
            
            String genderValue = request.getGender();
            if (genderValue != null && genderValue.trim().isEmpty()) {
                genderValue = null;
            } else if (genderValue != null) {
                genderValue = genderValue.trim();
            }

            // @MapsId를 사용하므로 user만 설정하면 userId가 자동으로 설정됨
            ApplicantProfile profile = ApplicantProfile.builder()
                    .user(savedUser) // @MapsId가 user.getId()로 userId를 자동 설정
                    .country(request.getCountry().trim().toUpperCase()) // 대문자로 변환 및 공백 제거
                    .city(request.getCity().trim())
                    .birthday(request.getBirthday())
                    .phone(phoneValue)
                    .address(addressValue)
                    .timezone(timezoneValue)
                    .languages(languagesStr)
                    .gender(genderValue)
                    .nationality(request.getCountry().trim().toUpperCase()) // 하위 호환성을 위해 country 값 사용
                    .channelVisibility(ApplicantProfile.ChannelVisibility.PUBLIC)
                    .build();
            
            try {
                applicantProfileRepository.save(profile);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                log.error("프로필 저장 중 데이터 무결성 오류: {}", e.getMessage(), e);
                if (e.getCause() instanceof java.sql.SQLException) {
                    java.sql.SQLException sqlEx = (java.sql.SQLException) e.getCause();
                    log.debug("SQL State: {}, Error Code: {}", sqlEx.getSQLState(), sqlEx.getErrorCode());
                }
                throw new RuntimeException("프로필 저장 중 데이터 무결성 오류가 발생했습니다: " + e.getMessage(), e);
            } catch (Exception e) {
                log.error("프로필 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("프로필 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        } else if (request.getUserType() == User.UserType.BUSINESS) {
            // 기획사 필수 필드 검증
            if (request.getBusinessCountry() == null || request.getBusinessCountry().trim().isEmpty()) {
                throw new RuntimeException("기획사 회원가입 시 국가는 필수입니다");
            }
            String businessCountry = request.getBusinessCountry().trim().toUpperCase();
            if (!businessCountry.matches("^[A-Z]{2}$")) {
                throw new RuntimeException("국가는 ISO 3166-1 alpha-2 형식이어야 합니다 (예: KR, US, JP). 입력된 값: " + request.getBusinessCountry());
            }
            if (request.getBusinessCity() == null || request.getBusinessCity().trim().isEmpty()) {
                throw new RuntimeException("기획사 회원가입 시 도시는 필수입니다");
            }
            if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
                throw new RuntimeException("기획사 회원가입 시 회사명은 필수입니다");
            }
            if (request.getBusinessRegistrationNumber() == null || request.getBusinessRegistrationNumber().trim().isEmpty()) {
                throw new RuntimeException("기획사 회원가입 시 사업자 등록번호는 필수입니다");
            }

            // 빈 문자열을 null로 변환
            String businessAddressValue = request.getBusinessAddress();
            if (businessAddressValue != null && businessAddressValue.trim().isEmpty()) {
                businessAddressValue = null;
            } else if (businessAddressValue != null) {
                businessAddressValue = businessAddressValue.trim();
            }
            
            String websiteValue = request.getWebsite();
            if (websiteValue != null && websiteValue.trim().isEmpty()) {
                websiteValue = null;
            } else if (websiteValue != null) {
                websiteValue = websiteValue.trim();
            }
            
            String contactEmailValue = request.getContactEmail();
            if (contactEmailValue != null && contactEmailValue.trim().isEmpty()) {
                contactEmailValue = null;
            } else if (contactEmailValue != null) {
                contactEmailValue = contactEmailValue.trim();
            }
            
            String contactPhoneValue = request.getContactPhone();
            if (contactPhoneValue != null && contactPhoneValue.trim().isEmpty()) {
                contactPhoneValue = null;
            } else if (contactPhoneValue != null) {
                contactPhoneValue = contactPhoneValue.trim();
            }
            
            String taxIdValue = request.getTaxId();
            if (taxIdValue != null && taxIdValue.trim().isEmpty()) {
                taxIdValue = null;
            } else if (taxIdValue != null) {
                taxIdValue = taxIdValue.trim();
            }
            
            String businessLicenseDocumentUrlValue = request.getBusinessLicenseDocumentUrl();
            if (businessLicenseDocumentUrlValue != null && businessLicenseDocumentUrlValue.trim().isEmpty()) {
                businessLicenseDocumentUrlValue = null;
            } else if (businessLicenseDocumentUrlValue != null) {
                businessLicenseDocumentUrlValue = businessLicenseDocumentUrlValue.trim();
            }

            // @MapsId를 사용하므로 user만 설정하면 userId가 자동으로 설정됨
            BusinessProfile profile = BusinessProfile.builder()
                    .user(savedUser) // @MapsId가 user.getId()로 userId를 자동 설정
                    .companyName(request.getCompanyName().trim())
                    .country(businessCountry) // 대문자로 변환된 값 사용
                    .city(request.getBusinessCity().trim())
                    .businessRegistrationNumber(request.getBusinessRegistrationNumber().trim())
                    .businessLicenseDocumentUrl(businessLicenseDocumentUrlValue)
                    .taxId(taxIdValue)
                    .address(businessAddressValue)
                    .website(websiteValue)
                    .contactEmail(contactEmailValue)
                    .contactPhone(contactPhoneValue)
                    .verificationStatus(BusinessProfile.VerificationStatus.PENDING) // 기본값: 대기 중
                    .build();
            
            try {
                businessProfileRepository.save(profile);
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                log.error("프로필 저장 중 데이터 무결성 오류: {}", e.getMessage(), e);
                if (e.getCause() instanceof java.sql.SQLException) {
                    java.sql.SQLException sqlEx = (java.sql.SQLException) e.getCause();
                    log.debug("SQL State: {}, Error Code: {}", sqlEx.getSQLState(), sqlEx.getErrorCode());
                }
                throw new RuntimeException("프로필 저장 중 데이터 무결성 오류가 발생했습니다: " + e.getMessage(), e);
            } catch (Exception e) {
                log.error("프로필 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("프로필 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        }

        // JWT 토큰 생성
        String token;
        try {
            token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getUserType().name());
        } catch (Exception e) {
            log.error("JWT 토큰 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("JWT 토큰 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .userType(savedUser.getUserType())
                .profileImageUrl(savedUser.getProfileImageUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUserType().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .userType(user.getUserType())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return userMapper.toDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return userMapper.toDto(user);
    }

    public Long getUserIdFromToken(String token) {
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    /**
     * 소셜 로그인 처리
     */
    public AuthResponse socialLogin(SocialLoginRequest request) {
        // 소셜 로그인 제공자로부터 사용자 정보 조회
        SocialUserInfo socialUserInfo = socialLoginService.getUserInfo(
                request.getProvider(),
                request.getAccessToken()
        );

        // 기존 사용자 조회 (provider와 providerId로)
        User user = userRepository.findByProviderAndProviderId(
                socialUserInfo.getProvider(),
                socialUserInfo.getProviderId()
        ).orElse(null);

        if (user == null) {
            // 신규 사용자 - 이메일로도 확인
            user = userRepository.findByEmail(socialUserInfo.getEmail())
                    .orElse(null);

            if (user == null) {
                // 완전히 새로운 사용자 - 회원가입 처리
                user = User.builder()
                        .email(socialUserInfo.getEmail())
                        .password(passwordEncoder.encode("SOCIAL_LOGIN_" + System.currentTimeMillis())) // 소셜 로그인은 비밀번호 불필요
                        .name(socialUserInfo.getName())
                        .userType(request.getUserType() != null ? request.getUserType() : User.UserType.APPLICANT) // 기본값: APPLICANT
                        .profileImageUrl(socialUserInfo.getProfileImageUrl())
                        .provider(socialUserInfo.getProvider())
                        .providerId(socialUserInfo.getProviderId())
                        .build();

                user = userRepository.save(user);

                // 프로필 생성 (APPLICANT인 경우)
                if (user.getUserType() == User.UserType.APPLICANT) {
                    ApplicantProfile profile = ApplicantProfile.builder()
                            .user(user) // @MapsId가 user.getId()로 userId를 자동 설정
                            .build();
                    try {
                        applicantProfileRepository.save(profile);
                    } catch (Exception e) {
                        log.error("소셜 로그인 프로필 저장 실패: {}", e.getMessage(), e);
                        throw new RuntimeException("소셜 로그인 프로필 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
                    }
                }
            } else {
                // 기존 사용자 - 소셜 로그인 정보 업데이트
                user.setProvider(socialUserInfo.getProvider());
                user.setProviderId(socialUserInfo.getProviderId());
                if (socialUserInfo.getProfileImageUrl() != null) {
                    user.setProfileImageUrl(socialUserInfo.getProfileImageUrl());
                }
                user = userRepository.save(user);
            }
        } else {
            // 소셜 로그인으로 가입한 사용자 - 프로필 이미지 업데이트
            if (socialUserInfo.getProfileImageUrl() != null) {
                user.setProfileImageUrl(socialUserInfo.getProfileImageUrl());
                user = userRepository.save(user);
            }
        }

        // JWT 토큰 생성
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUserType().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .userType(user.getUserType())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    /**
     * 아이디 찾기 (이름과 이메일로 찾기)
     */
    @Transactional(readOnly = true)
    public FindUserIdResponse findUserId(FindUserIdRequest request) {
        User user = userRepository.findByNameAndEmailAndDeletedAtIsNull(
                request.getName().trim(),
                request.getEmail().trim()
        ).orElseThrow(() -> new RuntimeException("입력하신 정보와 일치하는 계정을 찾을 수 없습니다"));

        // 이메일 마스킹 (예: abc@example.com -> ab***@example.com)
        String email = user.getEmail();
        String maskedEmail = maskEmail(email);

        return FindUserIdResponse.builder()
                .maskedEmail(maskedEmail)
                .build();
    }

    /**
     * 비밀번호 찾기 (재설정 토큰 발급)
     */
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("입력하신 이메일로 등록된 계정을 찾을 수 없습니다"));

        // 소셜 로그인 사용자는 비밀번호 재설정 불가
        if (user.getProvider() != User.Provider.LOCAL) {
            throw new RuntimeException("소셜 로그인으로 가입한 계정은 비밀번호 재설정이 불가능합니다");
        }

        // 비밀번호 재설정 토큰 생성
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1); // 1시간 후 만료

        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiresAt(expiresAt);
        userRepository.save(user);

        // 비밀번호 재설정 이메일 발송
        // 작업: 2026_05_email_reset_password
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken, user.getName());
        } catch (Exception e) {
            // 이메일 발송 실패해도 토큰은 생성되었으므로 로그만 남기고 계속 진행
            // 사용자에게는 성공 메시지를 보내되, 실제 이메일 발송 실패는 로그로 기록
            log.error("비밀번호 재설정 이메일 발송 실패: {}", e.getMessage(), e);
        }

        return ForgotPasswordResponse.builder()
                .message("비밀번호 재설정 링크가 이메일로 발송되었습니다. 이메일을 확인해주세요.")
                .build();
    }

    /**
     * 비밀번호 재설정
     */
    public void resetPassword(ResetPasswordRequest request) {
        // 비밀번호 확인 검증
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("새 비밀번호와 비밀번호 확인이 일치하지 않습니다");
        }

        // 토큰으로 사용자 찾기
        User user = userRepository.findByPasswordResetTokenAndPasswordResetTokenExpiresAtAfter(
                request.getResetToken(),
                LocalDateTime.now()
        ).orElseThrow(() -> new RuntimeException("유효하지 않거나 만료된 재설정 토큰입니다"));

        // 비밀번호 업데이트
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
    }

    /**
     * 이메일 마스킹 (예: abc@example.com -> ab***@example.com)
     */
    private String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return email;
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return email;
        }

        String localPart = email.substring(0, atIndex);
        String domainPart = email.substring(atIndex);

        if (localPart.length() <= 2) {
            return localPart.charAt(0) + "***" + domainPart;
        } else {
            return localPart.substring(0, 2) + "***" + domainPart;
        }
    }
}
