package com.audition.platform.domain.user;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.RANDOM)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String email;

    @Column(name = "password_hash", nullable = false, columnDefinition = "TEXT")
    private String passwordHash;

    @Column(nullable = false, columnDefinition = "TEXT")
    /** APPLICANT | AGENCY | ADMIN | SUPER_ADMIN | USER. 기획사 운영 권한은 본사 승인 뒤에만 AGENCY. */
    private String role;

    /** 가입 요청 유형. 접근 역할 {@link #role} 과 별도다. */
    @Column(name = "signup_intent", nullable = false, length = 16)
    private String signupIntent = "APPLICANT";

    /** 실명 등 법적·관리용. UI 비노출 원칙 — 공개 라벨은 {@link #nickname} 우선. */
    @Column(columnDefinition = "TEXT")
    private String name;

    /** 화면 표시용 닉네임(필수). */
    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String username;

    /**
     * {@link UserPublicNames#computePublicDisplay(String, String, String)} 와 동기화되는 비정규화 컬럼.
     */
    @Column(name = "display_name", nullable = false, columnDefinition = "TEXT")
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    /** 채널 헤더 한줄 소개(최대 30자). 상세 소개는 {@link #bio}. */
    @Column(name = "short_bio", length = 30)
    private String shortBio;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    /** 대량 지급 필터용 (선택) */
    @Column(name = "country_code", columnDefinition = "TEXT")
    private String countryCode;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    /** 지원서와 동일 코드: KR | MN | JP | OTHER */
    @Column(columnDefinition = "TEXT")
    private String nationality;

    @Column(name = "intro_text", columnDefinition = "TEXT")
    private String introText;

    /** 프로필 본문 원문 언어. 비어 있으면 미상이다. */
    @Column(name = "text_source_locale", length = 35)
    private String textSourceLocale;

    /** ACTIVE | SUSPENDED | DELETED */
    @Column(name = "account_status", nullable = false, length = 32)
    private String accountStatus = "ACTIVE";

    /** 타인에게 채널(공개 영상 목록) 노출 여부 */
    @Column(name = "is_channel_public", nullable = false)
    private boolean channelPublic = false;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "channel_categories", columnDefinition = "text[]", nullable = false)
    private String[] channelCategories = new String[0];

    @Column(name = "featured_video_id")
    private UUID featuredVideoId;

    /** 프로필 경력. 채널은 이 값을 다시 받지 않고 공개 여부만 고른다. */
    @Column(name = "career_text", columnDefinition = "TEXT")
    private String careerText;

    /** 프로필 활동 분야. 전문 분야는 {@link #channelCategories}. */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "activity_fields", columnDefinition = "text[]", nullable = false)
    private String[] activityFields = new String[0];

    /**
     * 공개 채널에 실을 프로필 키. null 이면 예전 공개 항목(경력·활동 제외)을 유지한다.
     * 빈 배열은 프로필 항목을 공개하지 않겠다는 저장값이다.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "channel_shown_fields", columnDefinition = "text[]")
    private String[] channelShownFields;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "recovery_code_hash", columnDefinition = "TEXT")
    private String recoveryCodeHash;

    @Column(name = "recovery_code_lookup", columnDefinition = "TEXT")
    private String recoveryCodeLookup;

    @Column(name = "recovery_code_issued_at")
    private Instant recoveryCodeIssuedAt;

    @Column(name = "recovery_failed_attempts", nullable = false)
    private int recoveryFailedAttempts;

    @Column(name = "recovery_locked_until")
    private Instant recoveryLockedUntil;

    @PrePersist
    @PreUpdate
    void syncDenormalizedDisplayName() {
        this.displayName = UserPublicNames.computePublicDisplay(nickname, name, email);
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getSignupIntent() { return signupIntent; }
    public void setSignupIntent(String signupIntent) { this.signupIntent = signupIntent; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    /** API·목록용 공개 라벨(닉네임 우선, 비상 시 이메일 로컬파트). 실명 미포함. */
    public String getPublicDisplayLabel() {
        return UserPublicNames.computePublicDisplay(nickname, name, email);
    }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getShortBio() {
        return shortBio;
    }

    public void setShortBio(String shortBio) {
        this.shortBio = shortBio;
    }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getIntroText() {
        return introText;
    }

    public void setIntroText(String introText) {
        this.introText = introText;
    }

    public String getTextSourceLocale() {
        return textSourceLocale;
    }

    public void setTextSourceLocale(String textSourceLocale) {
        this.textSourceLocale = textSourceLocale;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public boolean isChannelPublic() {
        return channelPublic;
    }

    public void setChannelPublic(boolean channelPublic) {
        this.channelPublic = channelPublic;
    }

    public String[] getChannelCategories() {
        return channelCategories != null ? channelCategories : new String[0];
    }

    public void setChannelCategories(String[] channelCategories) {
        this.channelCategories = channelCategories != null ? channelCategories : new String[0];
    }

    public UUID getFeaturedVideoId() {
        return featuredVideoId;
    }

    public void setFeaturedVideoId(UUID featuredVideoId) {
        this.featuredVideoId = featuredVideoId;
    }

    public String getCareerText() {
        return careerText;
    }

    public void setCareerText(String careerText) {
        this.careerText = careerText;
    }

    public String[] getActivityFields() {
        return activityFields != null ? activityFields : new String[0];
    }

    public void setActivityFields(String[] activityFields) {
        this.activityFields = activityFields != null ? activityFields : new String[0];
    }

    public String[] getChannelShownFields() {
        return channelShownFields;
    }

    public void setChannelShownFields(String[] channelShownFields) {
        this.channelShownFields = channelShownFields;
    }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getRecoveryCodeHash() { return recoveryCodeHash; }
    public void setRecoveryCodeHash(String recoveryCodeHash) { this.recoveryCodeHash = recoveryCodeHash; }
    public String getRecoveryCodeLookup() { return recoveryCodeLookup; }
    public void setRecoveryCodeLookup(String recoveryCodeLookup) { this.recoveryCodeLookup = recoveryCodeLookup; }
    public Instant getRecoveryCodeIssuedAt() { return recoveryCodeIssuedAt; }
    public void setRecoveryCodeIssuedAt(Instant recoveryCodeIssuedAt) { this.recoveryCodeIssuedAt = recoveryCodeIssuedAt; }
    public int getRecoveryFailedAttempts() { return recoveryFailedAttempts; }
    public void setRecoveryFailedAttempts(int recoveryFailedAttempts) { this.recoveryFailedAttempts = recoveryFailedAttempts; }
    public Instant getRecoveryLockedUntil() { return recoveryLockedUntil; }
    public void setRecoveryLockedUntil(Instant recoveryLockedUntil) { this.recoveryLockedUntil = recoveryLockedUntil; }
}
