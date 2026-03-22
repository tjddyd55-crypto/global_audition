package com.audition.platform.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreditPackageUpsertRequest {

    @NotBlank
    private String name;

    @NotNull
    @Min(0)
    private Long price;

    @NotNull
    @Min(0)
    private Long credits;

    @NotNull
    @Min(0)
    private Long bonusCredits;

    @NotNull
    private Boolean active;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getPrice() {
        return price;
    }

    public void setPrice(Long price) {
        this.price = price;
    }

    public Long getCredits() {
        return credits;
    }

    public void setCredits(Long credits) {
        this.credits = credits;
    }

    public Long getBonusCredits() {
        return bonusCredits;
    }

    public void setBonusCredits(Long bonusCredits) {
        this.bonusCredits = bonusCredits;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
