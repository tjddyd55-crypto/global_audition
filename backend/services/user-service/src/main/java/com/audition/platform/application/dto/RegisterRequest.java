package com.audition.platform.application.dto;

import com.audition.platform.domain.entity.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RegisterRequest {
    // 공통 필드
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "유효한 이메일 형식이 아닙니다")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    private String password;

    @NotBlank(message = "이름은 필수입니다")
    private String name;

    @NotNull(message = "사용자 타입은 필수입니다")
    private User.UserType userType;

    // 지망생(APPLICANT) 전용 필드
    private String country; // 필수 (지망생) - @Pattern은 조건부로 검증

    private String city; // 필수 (지망생)

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday; // 필수 (지망생) - @NotNull은 조건부로 검증

    private String phone; // 선택적

    private String address; // 선택적

    private String timezone; // 선택적

    private List<String> languages; // 선택적 (다중 선택)

    private String gender; // 선택적

    // 기획사(BUSINESS) 전용 필드
    private String businessCountry; // 필수 (기획사) - @Pattern은 조건부로 검증

    private String businessCity; // 필수 (기획사)

    private String companyName; // 필수 (기획사) - @NotBlank는 조건부로 검증

    private String businessRegistrationNumber; // 필수 (기획사) - @NotBlank는 조건부로 검증

    private String businessLicenseDocumentUrl; // 사업자 등록증 파일 URL (업로드 후)

    private String taxId; // 선택적 (국가별 세금 ID)

    private String businessAddress; // 선택적

    private String website; // 선택적

    private String contactEmail; // 선택적

    private String contactPhone; // 선택적
}
