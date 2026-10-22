package com.audition.platform.api.dto;

public class TranslationSettingsPatchRequest {

    private String endpointUrl;
    private String model;
    /** 비어 있으면 기존 암호문을 유지한다. 평문은 저장하지 않는다. */
    private String apiKey;

    public String getEndpointUrl() { return endpointUrl; }
    public void setEndpointUrl(String endpointUrl) { this.endpointUrl = endpointUrl; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
}
