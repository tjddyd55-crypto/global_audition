package com.audition.platform.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    /** 실명 등(선택). 하위 호환: 기획사 신청에서 legalName 이 없으면 계약 법인명으로 쓴다. */
    @Size(max = 120)
    private String name;

    /** 기획사 신청의 소속 국가. 일반 지원자는 비운다. */
    @Size(max = 8)
    private String countryCode;

    /** 기획사 표시명(회사명). */
    @Size(max = 200)
    private String companyName;

    /** 계약 법인명. */
    @Size(max = 200)
    private String legalName;

    /** 사업자등록번호. */
    @Size(max = 80)
    private String businessRegistrationNumber;

    /** 대표자명. */
    @Size(max = 120)
    private String representativeName;

    /** 기획사 연락 이메일(없으면 가입 이메일을 쓴다). */
    @Size(max = 255)
    private String contactEmail;

    /** 기획사 연락 전화번호. */
    @Size(max = 40)
    private String contactPhone;

    @Size(max = 500)
    private String website;

    /** 사업장 도시. */
    @Size(max = 120)
    private String businessCity;

    @Size(max = 80)
    private String taxId;

    @Size(max = 500)
    private String businessAddress;

    @Min(1800)
    @Max(2100)
    private Integer establishedYear;

    @Size(max = 1000)
    private String businessLicenseDocumentUrl;

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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getBusinessRegistrationNumber() {
        return businessRegistrationNumber;
    }

    public void setBusinessRegistrationNumber(String businessRegistrationNumber) {
        this.businessRegistrationNumber = businessRegistrationNumber;
    }

    public String getRepresentativeName() {
        return representativeName;
    }

    public void setRepresentativeName(String representativeName) {
        this.representativeName = representativeName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getBusinessCity() {
        return businessCity;
    }

    public void setBusinessCity(String businessCity) {
        this.businessCity = businessCity;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public String getBusinessAddress() {
        return businessAddress;
    }

    public void setBusinessAddress(String businessAddress) {
        this.businessAddress = businessAddress;
    }

    public Integer getEstablishedYear() {
        return establishedYear;
    }

    public void setEstablishedYear(Integer establishedYear) {
        this.establishedYear = establishedYear;
    }

    public String getBusinessLicenseDocumentUrl() {
        return businessLicenseDocumentUrl;
    }

    public void setBusinessLicenseDocumentUrl(String businessLicenseDocumentUrl) {
        this.businessLicenseDocumentUrl = businessLicenseDocumentUrl;
    }
}
