package com.audition.platform.api.dto;

public class TranslationProviderStatusView {

    private String provider;
    private String state;

    public TranslationProviderStatusView() {
    }

    public TranslationProviderStatusView(String provider, String state) {
        this.provider = provider;
        this.state = state;
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
