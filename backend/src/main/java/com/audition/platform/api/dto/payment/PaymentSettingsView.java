package com.audition.platform.api.dto.payment;

import java.time.Instant;

public class PaymentSettingsView {

    private boolean enabled;
    private String environment;
    private String currency;
    private String testClientKey;
    private String liveClientKey;
    private String testSecretMasked;
    private String liveSecretMasked;
    private boolean testSecretConfigured;
    private boolean liveSecretConfigured;
    private boolean foreignCardKrw;
    private boolean foreignCurrencyEnabled;
    private String variantKey;
    private String mid;
    private Instant updatedAt;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getTestClientKey() { return testClientKey; }
    public void setTestClientKey(String testClientKey) { this.testClientKey = testClientKey; }
    public String getLiveClientKey() { return liveClientKey; }
    public void setLiveClientKey(String liveClientKey) { this.liveClientKey = liveClientKey; }
    public String getTestSecretMasked() { return testSecretMasked; }
    public void setTestSecretMasked(String testSecretMasked) { this.testSecretMasked = testSecretMasked; }
    public String getLiveSecretMasked() { return liveSecretMasked; }
    public void setLiveSecretMasked(String liveSecretMasked) { this.liveSecretMasked = liveSecretMasked; }
    public boolean isTestSecretConfigured() { return testSecretConfigured; }
    public void setTestSecretConfigured(boolean testSecretConfigured) { this.testSecretConfigured = testSecretConfigured; }
    public boolean isLiveSecretConfigured() { return liveSecretConfigured; }
    public void setLiveSecretConfigured(boolean liveSecretConfigured) { this.liveSecretConfigured = liveSecretConfigured; }
    public boolean isForeignCardKrw() { return foreignCardKrw; }
    public void setForeignCardKrw(boolean foreignCardKrw) { this.foreignCardKrw = foreignCardKrw; }
    public boolean isForeignCurrencyEnabled() { return foreignCurrencyEnabled; }
    public void setForeignCurrencyEnabled(boolean foreignCurrencyEnabled) { this.foreignCurrencyEnabled = foreignCurrencyEnabled; }
    public String getVariantKey() { return variantKey; }
    public void setVariantKey(String variantKey) { this.variantKey = variantKey; }
    public String getMid() { return mid; }
    public void setMid(String mid) { this.mid = mid; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
