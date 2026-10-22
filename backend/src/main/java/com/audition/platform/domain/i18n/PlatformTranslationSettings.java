package com.audition.platform.domain.i18n;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_translation_settings")
public class PlatformTranslationSettings {

    @Id
    private Short id;

    @Column(nullable = false)
    private String provider = "OPENAI_COMPATIBLE";

    @Column(name = "active_provider", nullable = false)
    private String activeProvider = "GOOGLE_CLOUD_TRANSLATION";

    @Column(name = "google_project_id")
    private String googleProjectId;

    @Column(name = "google_location")
    private String googleLocation;

    @Column(name = "google_model")
    private String googleModel;

    @Column(name = "google_credentials_cipher")
    private String googleCredentialsCipher;

    @Column(name = "google_cost_micro_usd_per_million")
    private Long googleCostMicroUsdPerMillion;

    @Column(name = "endpoint_url")
    private String endpointUrl;

    @Column
    private String model;

    @Column(name = "api_key_cipher")
    private String apiKeyCipher;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "updated_by")
    private UUID updatedBy;

    public Short getId() { return id; }
    public void setId(Short id) { this.id = id; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getActiveProvider() { return activeProvider; }
    public void setActiveProvider(String activeProvider) { this.activeProvider = activeProvider; }
    public String getGoogleProjectId() { return googleProjectId; }
    public void setGoogleProjectId(String googleProjectId) { this.googleProjectId = googleProjectId; }
    public String getGoogleLocation() { return googleLocation; }
    public void setGoogleLocation(String googleLocation) { this.googleLocation = googleLocation; }
    public String getGoogleModel() { return googleModel; }
    public void setGoogleModel(String googleModel) { this.googleModel = googleModel; }
    public String getGoogleCredentialsCipher() { return googleCredentialsCipher; }
    public void setGoogleCredentialsCipher(String googleCredentialsCipher) { this.googleCredentialsCipher = googleCredentialsCipher; }
    public Long getGoogleCostMicroUsdPerMillion() { return googleCostMicroUsdPerMillion; }
    public void setGoogleCostMicroUsdPerMillion(Long googleCostMicroUsdPerMillion) {
        this.googleCostMicroUsdPerMillion = googleCostMicroUsdPerMillion;
    }
    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getApiKeyCipher() { return apiKeyCipher; }
    public void setApiKeyCipher(String apiKeyCipher) { this.apiKeyCipher = apiKeyCipher; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
