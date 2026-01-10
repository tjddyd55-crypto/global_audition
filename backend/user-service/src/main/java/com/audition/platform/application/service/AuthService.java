package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuthResponse;
import com.audition.platform.application.dto.LoginRequest;
import com.audition.platform.application.dto.RegisterRequest;
import com.audition.platform.application.dto.SocialLoginRequest;
import com.audition.platform.application.dto.UserDto;
import com.audition.platform.application.mapper.UserMapper;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.entity.BusinessProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import com.audition.platform.domain.repository.BusinessProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import com.audition.platform.infrastructure.security.JwtTokenProvider;
import com.audition.platform.infrastructure.security.PasswordEncoder;
import com.audition.platform.infrastructure.social.SocialLoginService;
import com.audition.platform.infrastructure.social.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final ApplicantProfileRepository applicantProfileRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final SocialLoginService socialLoginService;

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

        User savedUser = userRepository.save(user);
        
        // savedUser의 ID가 null인지 확인
        if (savedUser.getId() == null) {
            System.err.println("=== CRITICAL ERROR: savedUser.getId() is null ===");
            throw new RuntimeException("사용자 저장 후 ID를 가져올 수 없습니다");
        }
        
        System.out.println("=== User Saved Successfully ===");
        System.out.println("UserId: " + savedUser.getId());
        System.out.println("Email: " + savedUser.getEmail());
        System.out.println("UserType: " + savedUser.getUserType());

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

            ApplicantProfile profile = ApplicantProfile.builder()
                    .userId(savedUser.getId()) // userId 명시적 설정
                    .country(request.getCountry().trim().toUpperCase()) // 대문자로 변환 및 공백 제거
                    .city(request.getCity().trim())
                    .birthday(request.getBirthday())
                    .phone(phoneValue)
                    .address(addressValue)
                    .timezone(timezoneValue)
                    .languages(languagesStr)
                    .gender(genderValue)
                    .nationality(request.getCountry().trim().toUpperCase()) // 하위 호환성을 위해 country 값 사용
                    .build();
            
            // User 관계 설정 (참조용, 실제로는 userId만 사용)
            profile.setUser(savedUser);
            
            try {
                applicantProfileRepository.save(profile);
                System.out.println("=== ApplicantProfile Saved Successfully ===");
                System.out.println("UserId: " + profile.getUserId());
                System.out.println("Country: " + profile.getCountry());
                System.out.println("City: " + profile.getCity());
                System.out.println("Birthday: " + profile.getBirthday());
            } catch (Exception e) {
                System.err.println("=== Failed to Save ApplicantProfile ===");
                System.err.println("Error: " + e.getClass().getName());
                System.err.println("Message: " + e.getMessage());
                if (e.getCause() != null) {
                    System.err.println("Cause: " + e.getCause().getClass().getName());
                    System.err.println("Cause Message: " + e.getCause().getMessage());
                }
                e.printStackTrace();
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

            BusinessProfile profile = BusinessProfile.builder()
                    .userId(savedUser.getId()) // userId 명시적 설정
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
            
            // User 관계 설정 (참조용, 실제로는 userId만 사용)
            profile.setUser(savedUser);
            
            try {
                businessProfileRepository.save(profile);
                System.out.println("=== BusinessProfile Saved Successfully ===");
                System.out.println("UserId: " + profile.getUserId());
                System.out.println("CompanyName: " + profile.getCompanyName());
                System.out.println("Country: " + profile.getCountry());
            } catch (Exception e) {
                System.err.println("=== Failed to Save BusinessProfile ===");
                System.err.println("Error: " + e.getClass().getName());
                System.err.println("Message: " + e.getMessage());
                if (e.getCause() != null) {
                    System.err.println("Cause: " + e.getCause().getClass().getName());
                    System.err.println("Cause Message: " + e.getCause().getMessage());
                }
                e.printStackTrace();
                throw new RuntimeException("프로필 저장 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        }

        // JWT 토큰 생성
        String token;
        try {
            System.out.println("=== Generating JWT Token ===");
            System.out.println("UserId: " + savedUser.getId());
            System.out.println("UserType: " + savedUser.getUserType().name());
            token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getUserType().name());
            System.out.println("=== JWT Token Generated Successfully ===");
        } catch (Exception e) {
            System.err.println("=== Failed to Generate JWT Token ===");
            System.err.println("Error: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Cause: " + e.getCause().getClass().getName());
                System.err.println("Cause Message: " + e.getCause().getMessage());
            }
            e.printStackTrace();
            throw new RuntimeException("JWT 토큰 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        try {
            AuthResponse response = AuthResponse.builder()
                    .token(token)
                    .userId(savedUser.getId())
                    .email(savedUser.getEmail())
                    .name(savedUser.getName())
                    .userType(savedUser.getUserType())
                    .profileImageUrl(savedUser.getProfileImageUrl())
                    .build();
            
            System.out.println("=== Registration Completed Successfully ===");
            System.out.println("UserId: " + response.getUserId());
            System.out.println("Email: " + response.getEmail());
            System.out.println("UserType: " + response.getUserType());
            
            return response;
        } catch (Exception e) {
            System.err.println("=== Failed to Create AuthResponse ===");
            System.err.println("Error: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("응답 생성 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
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
                            .userId(user.getId()) // userId 명시적 설정
                            .build();
                    profile.setUser(user); // User 관계 설정
                    try {
                        applicantProfileRepository.save(profile);
                        System.out.println("=== Social Login ApplicantProfile Saved Successfully ===");
                    } catch (Exception e) {
                        System.err.println("=== Failed to Save Social Login ApplicantProfile ===");
                        System.err.println("Error: " + e.getClass().getName());
                        System.err.println("Message: " + e.getMessage());
                        e.printStackTrace();
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
}
