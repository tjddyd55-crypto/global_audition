package com.audition.platform.api.dto.me;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class MyApplicationDetailDto {

    private String applicationId;
    private String auditionId;
    private String auditionTitle;
    private Instant appliedAt;
    private String status;
    private List<ApplicationVideoDto> videos = new ArrayList<>();

    public String getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(String applicationId) {
        this.applicationId = applicationId;
    }

    public String getAuditionId() {
        return auditionId;
    }

    public void setAuditionId(String auditionId) {
        this.auditionId = auditionId;
    }

    public String getAuditionTitle() {
        return auditionTitle;
    }

    public void setAuditionTitle(String auditionTitle) {
        this.auditionTitle = auditionTitle;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(Instant appliedAt) {
        this.appliedAt = appliedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<ApplicationVideoDto> getVideos() {
        return videos;
    }

    public void setVideos(List<ApplicationVideoDto> videos) {
        this.videos = videos;
    }
}
