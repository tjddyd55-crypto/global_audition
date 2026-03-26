package com.audition.platform.api.dto.me;

import com.audition.platform.api.dto.AuditionRoundSummaryDto;

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

    /** 오디션 processMode — SINGLE 이면 다단계 UI 미표시 */
    private String processMode = "SINGLE";

    /** 지원자 현재 라운드 번호 */
    private int currentRoundNumber = 1;

    /** MULTI_ROUND 일 때 라운드 id·번호 (eligibility·제출 링크용) */
    private List<AuditionRoundSummaryDto> roundSummaries = new ArrayList<>();

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

    public String getProcessMode() {
        return processMode;
    }

    public void setProcessMode(String processMode) {
        this.processMode = processMode;
    }

    public int getCurrentRoundNumber() {
        return currentRoundNumber;
    }

    public void setCurrentRoundNumber(int currentRoundNumber) {
        this.currentRoundNumber = currentRoundNumber;
    }

    public List<AuditionRoundSummaryDto> getRoundSummaries() {
        return roundSummaries;
    }

    public void setRoundSummaries(List<AuditionRoundSummaryDto> roundSummaries) {
        this.roundSummaries = roundSummaries != null ? roundSummaries : new ArrayList<>();
    }
}
