package com.audition.platform.api.dto;

public class AuthResponse {

    private String token;
    private String role;
    /** 가입 요청 유형. 접근 역할 {@link #role} 과 다를 수 있다. */
    private String signupIntent;
    private String userId;
    private String email;
    private String nickname;
    private String profileImageUrl;
    /** 회원가입·재발급 응답에만 한 번 포함. 로그인에는 넣지 않는다. */
    private String recoveryCode;

    public AuthResponse() {}

    public AuthResponse(String token, String role, String userId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getSignupIntent() { return signupIntent; }
    public void setSignupIntent(String signupIntent) { this.signupIntent = signupIntent; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getRecoveryCode() {
        return recoveryCode;
    }

    public void setRecoveryCode(String recoveryCode) {
        this.recoveryCode = recoveryCode;
    }
}
