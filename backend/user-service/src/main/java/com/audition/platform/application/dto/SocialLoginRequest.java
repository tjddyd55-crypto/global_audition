package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.User;
import lombok.Data;

@Data
public class SocialLoginRequest {
    private String provider; // GOOGLE, KAKAO, NAVER
    private String accessToken; // 소셜 로그인 제공자의 액세스 토큰
    private String idToken; // Google의 경우 ID 토큰
    private User.UserType userType; // APPLICANT 또는 BUSINESS
}
