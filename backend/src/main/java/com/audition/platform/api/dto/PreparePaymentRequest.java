package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

public class PreparePaymentRequest {

    @NotBlank(message = "packageId가 필요합니다.")
    private String packageId;

    /** 예: MOCK (미입력 시 MOCK) */
    private String provider;

    public String getPackageId() {
        return packageId;
    }

    public void setPackageId(String packageId) {
        this.packageId = packageId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
