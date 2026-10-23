package com.audition.platform.application.i18n.content;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 번역 큐·할당. 가격이 0이면 추정 비용은 0으로 기록하고, 호출하지 않은 시도의 토큰은 만들지 않는다.
 * 비용 상한 0 이하는 그 상한을 끄기 위한 설정이다.
 */
@ConfigurationProperties(prefix = "app.translation.queue")
public class TranslationQueueProperties {

    private boolean enabled = true;
    private int pollMs = 5000;
    private int leaseSeconds = 120;
    private int maxAttempts = 3;
    private int drainBatch = 4;
    private int userJobsPerHour = 30;
    private int agencyJobsPerHour = 200;
    private int globalJobsPerHour = 2000;
    private int userJobsPerMinute = 10;
    private int anonymousJobsPerMinute = 20;
    private int abuseJobsPerHour = 80;
    private long userDailyCostMicroUsd = 5_000_000L;
    private long agencyDailyCostMicroUsd = 20_000_000L;
    private long globalDailyCostMicroUsd = 100_000_000L;
    private long userMonthlyCostMicroUsd = 50_000_000L;
    private long agencyMonthlyCostMicroUsd = 200_000_000L;
    private long globalMonthlyCostMicroUsd = 1_000_000_000L;
    private long globalMonthlyBilledCharacters = 2_000_000L;
    private long inputMicroUsdPerMillion = 0L;
    private long outputMicroUsdPerMillion = 0L;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public int getPollMs() { return pollMs; }
    public void setPollMs(int pollMs) { this.pollMs = pollMs; }
    public int getLeaseSeconds() { return leaseSeconds; }
    public void setLeaseSeconds(int leaseSeconds) { this.leaseSeconds = leaseSeconds; }
    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
    public int getDrainBatch() { return drainBatch; }
    public void setDrainBatch(int drainBatch) { this.drainBatch = drainBatch; }
    public int getUserJobsPerHour() { return userJobsPerHour; }
    public void setUserJobsPerHour(int userJobsPerHour) { this.userJobsPerHour = userJobsPerHour; }
    public int getAgencyJobsPerHour() { return agencyJobsPerHour; }
    public void setAgencyJobsPerHour(int agencyJobsPerHour) { this.agencyJobsPerHour = agencyJobsPerHour; }
    public int getGlobalJobsPerHour() { return globalJobsPerHour; }
    public void setGlobalJobsPerHour(int globalJobsPerHour) { this.globalJobsPerHour = globalJobsPerHour; }
    public int getUserJobsPerMinute() { return userJobsPerMinute; }
    public void setUserJobsPerMinute(int userJobsPerMinute) { this.userJobsPerMinute = userJobsPerMinute; }
    public int getAnonymousJobsPerMinute() { return anonymousJobsPerMinute; }
    public void setAnonymousJobsPerMinute(int anonymousJobsPerMinute) { this.anonymousJobsPerMinute = anonymousJobsPerMinute; }
    public int getAbuseJobsPerHour() { return abuseJobsPerHour; }
    public void setAbuseJobsPerHour(int abuseJobsPerHour) { this.abuseJobsPerHour = abuseJobsPerHour; }
    public long getUserDailyCostMicroUsd() { return userDailyCostMicroUsd; }
    public void setUserDailyCostMicroUsd(long userDailyCostMicroUsd) { this.userDailyCostMicroUsd = userDailyCostMicroUsd; }
    public long getAgencyDailyCostMicroUsd() { return agencyDailyCostMicroUsd; }
    public void setAgencyDailyCostMicroUsd(long agencyDailyCostMicroUsd) { this.agencyDailyCostMicroUsd = agencyDailyCostMicroUsd; }
    public long getGlobalDailyCostMicroUsd() { return globalDailyCostMicroUsd; }
    public void setGlobalDailyCostMicroUsd(long globalDailyCostMicroUsd) { this.globalDailyCostMicroUsd = globalDailyCostMicroUsd; }
    public long getUserMonthlyCostMicroUsd() { return userMonthlyCostMicroUsd; }
    public void setUserMonthlyCostMicroUsd(long userMonthlyCostMicroUsd) { this.userMonthlyCostMicroUsd = userMonthlyCostMicroUsd; }
    public long getAgencyMonthlyCostMicroUsd() { return agencyMonthlyCostMicroUsd; }
    public void setAgencyMonthlyCostMicroUsd(long agencyMonthlyCostMicroUsd) { this.agencyMonthlyCostMicroUsd = agencyMonthlyCostMicroUsd; }
    public long getGlobalMonthlyCostMicroUsd() { return globalMonthlyCostMicroUsd; }
    public void setGlobalMonthlyCostMicroUsd(long globalMonthlyCostMicroUsd) { this.globalMonthlyCostMicroUsd = globalMonthlyCostMicroUsd; }
    public long getGlobalMonthlyBilledCharacters() { return globalMonthlyBilledCharacters; }
    public void setGlobalMonthlyBilledCharacters(long globalMonthlyBilledCharacters) { this.globalMonthlyBilledCharacters = globalMonthlyBilledCharacters; }
    public long getInputMicroUsdPerMillion() { return inputMicroUsdPerMillion; }
    public void setInputMicroUsdPerMillion(long inputMicroUsdPerMillion) { this.inputMicroUsdPerMillion = inputMicroUsdPerMillion; }
    public long getOutputMicroUsdPerMillion() { return outputMicroUsdPerMillion; }
    public void setOutputMicroUsdPerMillion(long outputMicroUsdPerMillion) { this.outputMicroUsdPerMillion = outputMicroUsdPerMillion; }
}
