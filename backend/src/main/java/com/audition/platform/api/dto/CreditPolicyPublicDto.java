package com.audition.platform.api.dto;

/**
 * 비로그인 포함 공개 조회용 크레딧 정책 스냅샷 (민감 정보 없음).
 */
public class CreditPolicyPublicDto {

    private String policyKey;
    private long cost;
    private boolean active;

    public CreditPolicyPublicDto() {
    }

    public CreditPolicyPublicDto(String policyKey, long cost, boolean active) {
        this.policyKey = policyKey;
        this.cost = cost;
        this.active = active;
    }

    public String getPolicyKey() {
        return policyKey;
    }

    public void setPolicyKey(String policyKey) {
        this.policyKey = policyKey;
    }

    public long getCost() {
        return cost;
    }

    public void setCost(long cost) {
        this.cost = cost;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
