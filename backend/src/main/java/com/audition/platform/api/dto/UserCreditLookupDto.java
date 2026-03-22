package com.audition.platform.api.dto;

public class UserCreditLookupDto {

    private String userId;
    private String email;
    private long balance;

    public UserCreditLookupDto() {
    }

    public UserCreditLookupDto(String userId, String email, long balance) {
        this.userId = userId;
        this.email = email;
        this.balance = balance;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
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
}
