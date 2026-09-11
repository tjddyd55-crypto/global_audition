package com.audition.platform.api.dto;

/**
 * 비로그인 포함 공개 조회용 크레딧 정책 스냅샷 (민감 정보 없음).
 */
public class CreditPolicyPublicDto {

    private String policyKey;
    private long cost;
    private boolean active;
    /** FREE | CREDIT. active=false 또는 cost=0 이면 FREE. */
    private String applicationPaymentMode;
    private long applicationFeeCredits;

    public CreditPolicyPublicDto() {
    }

    public CreditPolicyPublicDto(String policyKey, long cost, boolean active) {
        this.policyKey = policyKey;
        this.cost = cost;
        this.active = active;
        this.applicationPaymentMode = (!active || cost <= 0) ? "FREE" : "CREDIT";
        this.applicationFeeCredits = Math.max(0, cost);
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

    public String getApplicationPaymentMode() {
        return applicationPaymentMode;
    }

    public void setApplicationPaymentMode(String applicationPaymentMode) {
        this.applicationPaymentMode = applicationPaymentMode;
    }

    public long getApplicationFeeCredits() {
        return applicationFeeCredits;
    }

    public void setApplicationFeeCredits(long applicationFeeCredits) {
        this.applicationFeeCredits = applicationFeeCredits;
    }
}
