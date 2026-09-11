package com.audition.platform.domain.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_payment_settings")
public class PlatformPaymentSettings {

    @Id
    @Column(nullable = false)
    private Short id = 1;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    private String environment = "TEST";

    @Column(nullable = false, length = 8)
    private String currency = "KRW";

    @Column(name = "test_client_key")
    private String testClientKey;

    @Column(name = "live_client_key")
    private String liveClientKey;

    @Column(name = "test_secret_cipher")
    private String testSecretCipher;

    @Column(name = "live_secret_cipher")
    private String liveSecretCipher;

    @Column(name = "foreign_card_krw", nullable = false)
    private boolean foreignCardKrw = false;

    @Column(name = "foreign_currency_enabled", nullable = false)
    private boolean foreignCurrencyEnabled = false;

    @Column(name = "variant_key")
    private String variantKey;

    private String mid;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public Short getId() { return id; }
    public void setId(Short id) { this.id = id; }
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
    public String getTestSecretCipher() { return testSecretCipher; }
    public void setTestSecretCipher(String testSecretCipher) { this.testSecretCipher = testSecretCipher; }
    public String getLiveSecretCipher() { return liveSecretCipher; }
    public void setLiveSecretCipher(String liveSecretCipher) { this.liveSecretCipher = liveSecretCipher; }
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
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
