package com.audition.platform.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

/** POST /api/auditions/{id}/votes/start */
public class StartVoteRequest {

    @NotBlank
    private String startAt;

    @NotBlank
    private String endAt;

    /** 비우면 현재 회차에서 투표 가능한 지원 전부를 후보로 확정한다. */
    private List<String> applicationIds = new ArrayList<>();

    public String getStartAt() { return startAt; }
    public void setStartAt(String startAt) { this.startAt = startAt; }
    public String getEndAt() { return endAt; }
    public void setEndAt(String endAt) { this.endAt = endAt; }
    public List<String> getApplicationIds() { return applicationIds; }
    public void setApplicationIds(List<String> applicationIds) {
        this.applicationIds = applicationIds != null ? applicationIds : new ArrayList<>();
    }
}
