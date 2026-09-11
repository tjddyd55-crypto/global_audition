package com.audition.platform.api.dto.payment;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PaymentSettingsPatchRequest {

    private Boolean enabled;

    @Pattern(regexp = "TEST|LIVE")
    private String environment;

    @Size(max = 8)
    private String currency;

    private String testClientKey;
    private String liveClientKey;
    /** 평문 시크릿. 빈 문자열이면 유지. */
    private String testSecretKey;
    private String liveSecretKey;
    private Boolean foreignCardKrw;
    private Boolean foreignCurrencyEnabled;
    private String variantKey;
    private String mid;

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getTestClientKey() { return testClientKey; }
    public void setTestClientKey(String testClientKey) { this.testClientKey = testClientKey; }
    public String getLiveClientKey() { return liveClientKey; }
    public void setLiveClientKey(String liveClientKey) { this.liveClientKey = liveClientKey; }
    public String getTestSecretKey() { return testSecretKey; }
    public void setTestSecretKey(String testSecretKey) { this.testSecretKey = testSecretKey; }
    public String getLiveSecretKey() { return liveSecretKey; }
    public void setLiveSecretKey(String liveSecretKey) { this.liveSecretKey = liveSecretKey; }
    public Boolean getForeignCardKrw() { return foreignCardKrw; }
    public void setForeignCardKrw(Boolean foreignCardKrw) { this.foreignCardKrw = foreignCardKrw; }
    public Boolean getForeignCurrencyEnabled() { return foreignCurrencyEnabled; }
    public void setForeignCurrencyEnabled(Boolean foreignCurrencyEnabled) { this.foreignCurrencyEnabled = foreignCurrencyEnabled; }
    public String getVariantKey() { return variantKey; }
    public void setVariantKey(String variantKey) { this.variantKey = variantKey; }
    public String getMid() { return mid; }
    public void setMid(String mid) { this.mid = mid; }
}
