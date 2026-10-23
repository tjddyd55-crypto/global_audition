package com.audition.platform.api.dto;

import java.util.ArrayList;
import java.util.List;

/** 시도 행을 월 단위로 합친 추정 사용량. 청구서가 아니다. */
public class TranslationUsageView {

    private String month;
    private long attempts;
    private long billedCharacters;
    private long estimatedCostMicroUsd;
    private List<TranslationUsageSlice> providers = new ArrayList<>();

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    public long getAttempts() { return attempts; }
    public void setAttempts(long attempts) { this.attempts = attempts; }
    public long getBilledCharacters() { return billedCharacters; }
    public void setBilledCharacters(long billedCharacters) { this.billedCharacters = billedCharacters; }
    public long getEstimatedCostMicroUsd() { return estimatedCostMicroUsd; }
    public void setEstimatedCostMicroUsd(long estimatedCostMicroUsd) { this.estimatedCostMicroUsd = estimatedCostMicroUsd; }
    public List<TranslationUsageSlice> getProviders() { return providers; }
    public void setProviders(List<TranslationUsageSlice> providers) { this.providers = providers; }

    public static class TranslationUsageSlice {
        private String provider;
        private long attempts;
        private long billedCharacters;
        private long estimatedCostMicroUsd;

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public long getAttempts() { return attempts; }
        public void setAttempts(long attempts) { this.attempts = attempts; }
        public long getBilledCharacters() { return billedCharacters; }
        public void setBilledCharacters(long billedCharacters) { this.billedCharacters = billedCharacters; }
        public long getEstimatedCostMicroUsd() { return estimatedCostMicroUsd; }
        public void setEstimatedCostMicroUsd(long estimatedCostMicroUsd) { this.estimatedCostMicroUsd = estimatedCostMicroUsd; }
    }
}
