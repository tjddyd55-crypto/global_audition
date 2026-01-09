package com.audition.platform.application.service;

import com.audition.platform.application.dto.AuthResponse;
import com.audition.platform.application.dto.LoginRequest;
import com.audition.platform.application.dto.RegisterRequest;
import com.audition.platform.domain.entity.ApplicantProfile;
import com.audition.platform.domain.entity.BusinessProfile;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.ApplicantProfileRepository;
import com.audition.platform.domain.repository.BusinessProfileRepository;
import com.audition.platform.domain.repository.UserRepository;
import com.audition.platform.infrastructure.security.JwtTokenProvider;
import com.audition.platform.infrastructure.security.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicantProfileRepository applicantProfileRepository;

    @Mock
    private BusinessProfileRepository businessProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private com.audition.platform.application.mapper.UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .name("테스트 사용자")
                .userType(User.UserType.APPLICANT)
                .build();
    }

    @Test
    void shouldRegisterApplicant() {
        // given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setPassword("password123");
        request.setName("새 사용자");
        request.setUserType(User.UserType.APPLICANT);

        User savedUser = User.builder()
                .id(2L)
                .email("new@example.com")
                .name("새 사용자")
                .userType(User.UserType.APPLICANT)
                .build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtTokenProvider.generateToken(anyLong(), anyString())).thenReturn("test-token");
        when(applicantProfileRepository.save(any(ApplicantProfile.class)))
                .thenReturn(ApplicantProfile.builder().userId(2L).build());

        // when
        AuthResponse response = authService.register(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("new@example.com");
        assertThat(response.getUserType()).isEqualTo(User.UserType.APPLICANT);
        verify(userRepository, times(1)).save(any(User.class));
        verify(applicantProfileRepository, times(1)).save(any(ApplicantProfile.class));
    }

    @Test
    void shouldThrowExceptionWhenEmailAlreadyExists() {
        // given
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");
        request.setPassword("password123");
        request.setName("사용자");
        request.setUserType(User.UserType.APPLICANT);

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미 등록된 이메일");
    }

    @Test
    void shouldLoginSuccessfully() {
        // given
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmailAndDeletedAtIsNull("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtTokenProvider.generateToken(1L, "APPLICANT")).thenReturn("test-token");

        // when
        AuthResponse response = authService.login(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("test-token");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void shouldThrowExceptionWhenLoginWithWrongPassword() {
        // given
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("wrongPassword");

        when(userRepository.findByEmailAndDeletedAtIsNull("test@example.com"))
                .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이메일 또는 비밀번호");
    }
}
