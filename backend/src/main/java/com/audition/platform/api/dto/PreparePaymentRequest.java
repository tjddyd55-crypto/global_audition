package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

public class PreparePaymentRequest {

    @NotBlank(message = "packageId가 필요합니다.")
    private String packageId;

    public String getPackageId() {
        return packageId;
    }

    public void setPackageId(String packageId) {
        this.packageId = packageId;
    }
}
