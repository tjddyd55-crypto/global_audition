package com.audition.platform.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SignupRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    @Pattern(regexp = "APPLICANT|AGENCY")
    private String role;

    /** 화면용 닉네임(필수). 상세 규칙은 {@link com.audition.platform.domain.user.NicknamePolicy}. */
    @NotBlank
    @Size(min = 2, max = 20)
    @Pattern(regexp = "^[a-zA-Z0-9가-힣._]+$")
    private String nickname;

    /** 실명 등(선택). 기획사 신청에서는 계약 법인명으로 쓴다. */
    @Size(max = 120)
    private String name;

    /** 기획사 신청의 소속 국가. 일반 지원자는 비운다. */
    @Size(max = 8)
    private String countryCode;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }
}
