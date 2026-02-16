package com.audition.platform.api.dto;

import java.util.List;

public class AgencyDashboardResponse {
    private long totalAuditions;
    private long openAuditions;
    private long totalApplications;
    private long accepted;
    private long rejected;
    private long pending;
    private List<AuditionResponse> recentAuditions;
    private List<ApplicationResponse> recentApplications;

    public long getTotalAuditions() { return totalAuditions; }
    public void setTotalAuditions(long totalAuditions) { this.totalAuditions = totalAuditions; }
    public long getOpenAuditions() { return openAuditions; }
    public void setOpenAuditions(long openAuditions) { this.openAuditions = openAuditions; }
    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }
    public long getAccepted() { return accepted; }
    public void setAccepted(long accepted) { this.accepted = accepted; }
    public long getRejected() { return rejected; }
    public void setRejected(long rejected) { this.rejected = rejected; }
    public long getPending() { return pending; }
    public void setPending(long pending) { this.pending = pending; }
    public List<AuditionResponse> getRecentAuditions() { return recentAuditions; }
    public void setRecentAuditions(List<AuditionResponse> recentAuditions) { this.recentAuditions = recentAuditions; }
    public List<ApplicationResponse> getRecentApplications() { return recentApplications; }
    public void setRecentApplications(List<ApplicationResponse> recentApplications) { this.recentApplications = recentApplications; }
}
