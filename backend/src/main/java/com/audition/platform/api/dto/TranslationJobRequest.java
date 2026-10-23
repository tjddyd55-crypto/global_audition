package com.audition.platform.api.dto;

public class TranslationJobRequest {

    private String locale;
    private boolean force;

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public boolean isForce() { return force; }
    public void setForce(boolean force) { this.force = force; }
}
