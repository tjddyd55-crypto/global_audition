package com.audition.platform.api.dto;

import java.math.BigDecimal;

/**
 * 스토어(일반 사용자)용 크레딧 패키지 노출. 활성 상품만 반환한다.
 */
public class CreditPackageCatalogItemDto {

    private String id;
    private String name;
    private BigDecimal price;
    private long credits;
    private long bonusCredits;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public long getCredits() {
        return credits;
    }

    public void setCredits(long credits) {
        this.credits = credits;
    }

    public long getBonusCredits() {
        return bonusCredits;
    }

    public void setBonusCredits(long bonusCredits) {
        this.bonusCredits = bonusCredits;
    }
}
