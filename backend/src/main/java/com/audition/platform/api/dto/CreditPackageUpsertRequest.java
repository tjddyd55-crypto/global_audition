package com.audition.platform.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreditPackageUpsertRequest {

    @NotBlank
    private String name;

    /** 패키지 판매가 (USD 달러, 소수 2자리까지). */
    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    @Digits(integer = 12, fraction = 2)
    private BigDecimal price;

    @NotNull
    @Min(0)
    private Long credits;

    @NotNull
    @Min(0)
    private Long bonusCredits;

    @NotNull
    private Boolean active;

    /** 정렬 (작을수록 먼저). 미입력 시 0 */
    @Min(0)
    private Integer sortOrder;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
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

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public int sortOrderOrDefault() {
        return sortOrder == null ? 0 : sortOrder;
    }
}
