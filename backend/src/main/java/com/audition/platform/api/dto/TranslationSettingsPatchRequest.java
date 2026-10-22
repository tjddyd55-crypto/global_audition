package com.audition.platform.api.dto;

public class TranslationSettingsPatchRequest {

    private String activeProvider;
    private String endpointUrl;
    private String model;
    /** 비어 있으면 기존 OpenAI 암호문을 유지한다. 평문은 저장하지 않는다. */
    private String apiKey;
    private String googleProjectId;
    private String googleLocation;
    private String googleModel;
    /** 비어 있으면 기존 서비스 계정 암호문을 유지한다. 평문은 저장하지 않는다. */
    private String googleCredentialsJson;
    private Long googleCostMicroUsdPerMillion;

    public String getActiveProvider() { return activeProvider; }
    public void setActiveProvider(String activeProvider) { this.activeProvider = activeProvider; }
    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getGoogleProjectId() { return googleProjectId; }
    public void setGoogleProjectId(String googleProjectId) { this.googleProjectId = googleProjectId; }
    public String getGoogleLocation() { return googleLocation; }
    public void setGoogleLocation(String googleLocation) { this.googleLocation = googleLocation; }
    public String getGoogleModel() { return googleModel; }
    public void setGoogleModel(String googleModel) { this.googleModel = googleModel; }
    public String getGoogleCredentialsJson() { return googleCredentialsJson; }
    public void setGoogleCredentialsJson(String googleCredentialsJson) { this.googleCredentialsJson = googleCredentialsJson; }
    public Long getGoogleCostMicroUsdPerMillion() { return googleCostMicroUsdPerMillion; }
    public void setGoogleCostMicroUsdPerMillion(Long googleCostMicroUsdPerMillion) {
        this.googleCostMicroUsdPerMillion = googleCostMicroUsdPerMillion;
    }
}
