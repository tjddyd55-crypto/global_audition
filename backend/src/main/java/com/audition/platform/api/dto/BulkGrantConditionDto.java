package com.audition.platform.api.dto;

import java.time.Instant;

public class BulkGrantConditionDto {

    private String country;

    private Instant createdAfter;

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Instant getCreatedAfter() {
        return createdAfter;
    }

    public void setCreatedAfter(Instant createdAfter) {
        this.createdAfter = createdAfter;
    }
}
