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
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .userType(request.getUserType())
                .build();

        User savedUser = userRepository.save(user);

        // 프로필 생성
        if (request.getUserType() == User.UserType.APPLICANT) {
            // 지망생 필수 필드 검증
            if (request.getCountry() == null || request.getCity() == null || request.getBirthday() == null) {
                throw new RuntimeException("지망생 회원가입 시 국가, 도시, 생년월일은 필수입니다");
            }

            String languagesStr = request.getLanguages() != null && !request.getLanguages().isEmpty()
                    ? String.join(",", request.getLanguages())
                    : null;

            ApplicantProfile profile = ApplicantProfile.builder()
                    .userId(savedUser.getId()) // userId 명시적 설정
                    .user(savedUser)
                    .country(request.getCountry())
                    .city(request.getCity())
                    .birthday(request.getBirthday())
                    .phone(request.getPhone())
                    .address(request.getAddress())
                    .timezone(request.getTimezone())
                    .languages(languagesStr)
                    .gender(request.getGender())
                    .nationality(request.getCountry()) // 하위 호환성을 위해 country 값 사용
                    .build();
            applicantProfileRepository.save(profile);
        } else if (request.getUserType() == User.UserType.BUSINESS) {
            // 기획사 필수 필드 검증
            if (request.getBusinessCountry() == null || request.getBusinessCountry().trim().isEmpty()) {
                throw new RuntimeException("기획사 회원가입 시 국가는 필수입니다");
            }
            if (!request.getBusinessCountry().matches("^[A-Z]{2}$")) {
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

            BusinessProfile profile = BusinessProfile.builder()
                    .userId(savedUser.getId()) // userId 명시적 설정
                    .user(savedUser)
                    .companyName(request.getCompanyName())
                    .country(request.getBusinessCountry())
                    .city(request.getBusinessCity())
                    .businessRegistrationNumber(request.getBusinessRegistrationNumber())
                    .businessLicenseDocumentUrl(request.getBusinessLicenseDocumentUrl())
                    .taxId(request.getTaxId())
                    .address(request.getBusinessAddress())
                    .website(request.getWebsite())
                    .contactEmail(request.getContactEmail())
                    .contactPhone(request.getContactPhone())
                    .verificationStatus(BusinessProfile.VerificationStatus.PENDING) // 기본값: 대기 중
                    .build();
            businessProfileRepository.save(profile);
        }

        // JWT 토큰 생성
        String token = jwtTokenProvider.generateToken(savedUser.getId(), savedUser.getUserType().name());

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
                            .userId(user.getId()) // userId 명시적 설정
                            .user(user)
                            .build();
                    applicantProfileRepository.save(profile);
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
