package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "business_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class BusinessProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "banner_url")
    private String bannerUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String website;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "established_year")
    private Integer establishedYear;

    // 국제화 및 사업자 정보 필드
    @Column(length = 2)
    private String country; // ISO 3166-1 alpha-2 코드

    private String city;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "legal_name")
    private String legalName; // 공식 법인명

    @Column(name = "representative_name")
    private String representativeName; // 대표자명

    @Column(name = "business_registration_number", length = 100)
    private String businessRegistrationNumber; // 국가별 형식 다름

    @Column(name = "business_license_document_url", length = 500)
    private String businessLicenseDocumentUrl; // 사업자 등록증 파일 URL

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING; // PENDING, VERIFIED, REJECTED

    @Column(name = "tax_id", length = 100)
    private String taxId; // 국가별 세금 ID (EIN, VAT 등)

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt; // 검증 완료 일시

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes; // 검증 메모

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VerificationStatus {
        PENDING,    // 대기 중
        VERIFIED,   // 검증 완료
        REJECTED    // 거부됨
    }
}
