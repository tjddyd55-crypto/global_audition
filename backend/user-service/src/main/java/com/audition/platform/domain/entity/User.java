package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true) // 소셜 로그인 사용자는 비밀번호가 없을 수 있음
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    // 소셜 로그인 관련 필드
    @Column(name = "provider")
    @Enumerated(EnumType.STRING)
    private Provider provider; // GOOGLE, KAKAO, NAVER, LOCAL

    @Column(name = "provider_id")
    private String providerId; // 소셜 로그인 제공자의 사용자 ID

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public enum UserType {
        APPLICANT,  // 지망생
        BUSINESS    // 기획사
    }

    public enum Provider {
        LOCAL,      // 일반 회원가입
        GOOGLE,     // Google 소셜 로그인
        KAKAO,      // Kakao 소셜 로그인
        NAVER,      // Naver 소셜 로그인
        FACEBOOK    // Facebook 소셜 로그인
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
