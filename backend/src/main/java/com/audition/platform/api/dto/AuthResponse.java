package com.audition.platform.api.dto;

public class AuthResponse {

    private String token;
    private String role;
    private String userId;

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
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
