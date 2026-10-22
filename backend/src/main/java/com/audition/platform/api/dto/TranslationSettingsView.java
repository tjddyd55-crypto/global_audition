package com.audition.platform.api.dto;

public class TranslationSettingsView {

    private String provider;
    private String endpointUrl;
    private String model;
    private boolean apiKeyConfigured;
    private String state;

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public boolean isApiKeyConfigured() { return apiKeyConfigured; }
    public void setApiKeyConfigured(boolean apiKeyConfigured) { this.apiKeyConfigured = apiKeyConfigured; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
