package com.audition.platform.api.dto;

import java.time.Instant;

public class UserCreditLookupDto {

    private String userId;
    private String nickname;
    private String name;
    private String email;
    private long balance;
    private String accountStatus;
    private Instant createdAt;

    public UserCreditLookupDto() {
    }

    public UserCreditLookupDto(
            String userId,
            String nickname,
            String name,
            String email,
            long balance,
            String accountStatus,
            Instant createdAt) {
        this.userId = userId;
        this.nickname = nickname;
        this.name = name;
        this.email = email;
        this.balance = balance;
        this.accountStatus = accountStatus;
        this.createdAt = createdAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
