package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuthResponse;
import com.audition.platform.application.dto.LoginRequest;
import com.audition.platform.application.dto.RegisterRequest;
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
            ApplicantProfile profile = ApplicantProfile.builder()
                    .userId(savedUser.getId())
                    .user(savedUser)
                    .build();
            applicantProfileRepository.save(profile);
        } else if (request.getUserType() == User.UserType.BUSINESS) {
            BusinessProfile profile = BusinessProfile.builder()
                    .userId(savedUser.getId())
                    .user(savedUser)
                    .companyName(request.getName()) // 초기값으로 이름 사용
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
}
