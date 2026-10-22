package com.audition.platform.api.dto;

import java.util.List;

/** 연결 시험과 지원 언어 조회 결과. 비밀 값은 담지 않는다. */
public class TranslationProbeView {

    private String provider;
    private String projectId;
    private String location;
    private String state;
    private String errorCode;
    private boolean calledProvider;
    private List<String> languageCodes;
    private boolean koreanSupported;
    private boolean englishSupported;
    private boolean mongolianSupported;

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public boolean isCalledProvider() { return calledProvider; }
    public void setCalledProvider(boolean calledProvider) { this.calledProvider = calledProvider; }
    public List<String> getLanguageCodes() { return languageCodes; }
    public void setLanguageCodes(List<String> languageCodes) { this.languageCodes = languageCodes; }
    public boolean isKoreanSupported() { return koreanSupported; }
    public void setKoreanSupported(boolean koreanSupported) { this.koreanSupported = koreanSupported; }
    public boolean isEnglishSupported() { return englishSupported; }
    public void setEnglishSupported(boolean englishSupported) { this.englishSupported = englishSupported; }
    public boolean isMongolianSupported() { return mongolianSupported; }
    public void setMongolianSupported(boolean mongolianSupported) { this.mongolianSupported = mongolianSupported; }
}
