package com.audition.platform.api.dto;

import jakarta.validation.constraints.Min;

public class CreditPolicyPatchRequest {

    @Min(0)
    private Long cost;

    private Boolean active;

    public Long getCost() {
        return cost;
    }

    public void setCost(Long cost) {
        this.cost = cost;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
