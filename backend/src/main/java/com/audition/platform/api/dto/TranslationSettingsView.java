package com.audition.platform.api.dto;

public class TranslationSettingsView {

    private String provider;
    private String activeProvider;
    private String endpointUrl;
    private String model;
    private boolean apiKeyConfigured;
    private String openAiState;
    private String googleProjectId;
    private String googleLocation;
    private String googleModel;
    private boolean googleCredentialsConfigured;
    private String googleState;
    private Long googleCostMicroUsdPerMillion;
    private long effectiveGoogleMicroUsdPerMillion;
    private String state;

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getActiveProvider() { return activeProvider; }
    public void setActiveProvider(String activeProvider) { this.activeProvider = activeProvider; }
    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public boolean isApiKeyConfigured() { return apiKeyConfigured; }
    public void setApiKeyConfigured(boolean apiKeyConfigured) { this.apiKeyConfigured = apiKeyConfigured; }
    public String getOpenAiState() { return openAiState; }
    public void setOpenAiState(String openAiState) { this.openAiState = openAiState; }
    public String getGoogleProjectId() { return googleProjectId; }
    public void setGoogleProjectId(String googleProjectId) { this.googleProjectId = googleProjectId; }
    public String getGoogleLocation() { return googleLocation; }
    public void setGoogleLocation(String googleLocation) { this.googleLocation = googleLocation; }
    public String getGoogleModel() { return googleModel; }
    public void setGoogleModel(String googleModel) { this.googleModel = googleModel; }
    public boolean isGoogleCredentialsConfigured() { return googleCredentialsConfigured; }
    public void setGoogleCredentialsConfigured(boolean googleCredentialsConfigured) {
        this.googleCredentialsConfigured = googleCredentialsConfigured;
    }
    public String getGoogleState() { return googleState; }
    public void setGoogleState(String googleState) { this.googleState = googleState; }
    public Long getGoogleCostMicroUsdPerMillion() { return googleCostMicroUsdPerMillion; }
    public void setGoogleCostMicroUsdPerMillion(Long googleCostMicroUsdPerMillion) {
        this.googleCostMicroUsdPerMillion = googleCostMicroUsdPerMillion;
    }
    public long getEffectiveGoogleMicroUsdPerMillion() { return effectiveGoogleMicroUsdPerMillion; }
    public void setEffectiveGoogleMicroUsdPerMillion(long effectiveGoogleMicroUsdPerMillion) {
        this.effectiveGoogleMicroUsdPerMillion = effectiveGoogleMicroUsdPerMillion;
    }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
