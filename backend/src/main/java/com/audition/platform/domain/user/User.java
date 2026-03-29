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
    /** APPLICANT | AGENCY | ADMIN | SUPER_ADMIN | USER */
    private String role;

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

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
