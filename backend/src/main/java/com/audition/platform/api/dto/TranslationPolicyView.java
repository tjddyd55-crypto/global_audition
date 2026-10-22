package com.audition.platform.api.dto;

import java.util.ArrayList;
import java.util.List;

/** 1차 운영의 화면 언어와 번역 대상, 서버 예산. 공급자 할당량과 별개다. */
public class TranslationPolicyView {

    private String viewingDefault;
    private String agencyUiLocale;
    private String superAdminUiLocale;
    private List<String> publicSelector = new ArrayList<>();
    private List<String> uiLocales = new ArrayList<>();
    private List<String> activeTranslationTargets = new ArrayList<>();
    private long globalDailyCostMicroUsd;
    private long globalMonthlyCostMicroUsd;
    private long globalMonthlyBilledCharacters;

    public String getViewingDefault() { return viewingDefault; }
    public void setViewingDefault(String viewingDefault) { this.viewingDefault = viewingDefault; }
    public String getAgencyUiLocale() { return agencyUiLocale; }
    public void setAgencyUiLocale(String agencyUiLocale) { this.agencyUiLocale = agencyUiLocale; }
    public String getSuperAdminUiLocale() { return superAdminUiLocale; }
    public void setSuperAdminUiLocale(String superAdminUiLocale) { this.superAdminUiLocale = superAdminUiLocale; }
    public List<String> getPublicSelector() { return publicSelector; }
    public void setPublicSelector(List<String> publicSelector) { this.publicSelector = publicSelector; }
    public List<String> getUiLocales() { return uiLocales; }
    public void setUiLocales(List<String> uiLocales) { this.uiLocales = uiLocales; }
    public List<String> getActiveTranslationTargets() { return activeTranslationTargets; }
    public void setActiveTranslationTargets(List<String> activeTranslationTargets) { this.activeTranslationTargets = activeTranslationTargets; }
    public long getGlobalDailyCostMicroUsd() { return globalDailyCostMicroUsd; }
    public void setGlobalDailyCostMicroUsd(long globalDailyCostMicroUsd) { this.globalDailyCostMicroUsd = globalDailyCostMicroUsd; }
    public long getGlobalMonthlyCostMicroUsd() { return globalMonthlyCostMicroUsd; }
    public void setGlobalMonthlyCostMicroUsd(long globalMonthlyCostMicroUsd) { this.globalMonthlyCostMicroUsd = globalMonthlyCostMicroUsd; }
    public long getGlobalMonthlyBilledCharacters() { return globalMonthlyBilledCharacters; }
    public void setGlobalMonthlyBilledCharacters(long globalMonthlyBilledCharacters) { this.globalMonthlyBilledCharacters = globalMonthlyBilledCharacters; }
}
