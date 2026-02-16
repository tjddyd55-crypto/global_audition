package com.audition.platform.api.dto;

import java.util.List;

public class ApplicantDashboardResponse {
    private long applied;
    private long reviewed;
    private long accepted;
    private long rejected;
    private long videosCount;
    private List<ApplicationResponse> recentApplications;

    public long getApplied() { return applied; }
    public void setApplied(long applied) { this.applied = applied; }
    public long getReviewed() { return reviewed; }
    public void setReviewed(long reviewed) { this.reviewed = reviewed; }
    public long getAccepted() { return accepted; }
    public void setAccepted(long accepted) { this.accepted = accepted; }
    public long getRejected() { return rejected; }
    public void setRejected(long rejected) { this.rejected = rejected; }
    public long getVideosCount() { return videosCount; }
    public void setVideosCount(long videosCount) { this.videosCount = videosCount; }
    public List<ApplicationResponse> getRecentApplications() { return recentApplications; }
    public void setRecentApplications(List<ApplicationResponse> recentApplications) { this.recentApplications = recentApplications; }
}
