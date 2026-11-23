package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

/**
 * GET /api/auditions/{id}/votes 응답 data 본문
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PublicVotePageDataDto {

    private VotePageAuditionDto audition;
    private VotePageSummaryDto summary;
    private String myVoteApplicationId;
    /** 현재 회차 투표 사용 여부. false 면 목록·투표 버튼을 숨긴다(기존 투표 데이터는 유지). */
    private boolean votingEnabled = true;
    /** 공고 설정에서 이 회차 공개 투표를 쓰는지(시작 여부와 별개). */
    private boolean votingPlanEnabled = true;
    private int roundNumber = 1;

    public boolean isVotingEnabled() { return votingEnabled; }
    public void setVotingEnabled(boolean votingEnabled) { this.votingEnabled = votingEnabled; }
    public boolean isVotingPlanEnabled() { return votingPlanEnabled; }
    public void setVotingPlanEnabled(boolean votingPlanEnabled) { this.votingPlanEnabled = votingPlanEnabled; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    /** NOT_STARTED / SCHEDULED / OPEN / CLOSED */
    private String voteStatus;
    private java.time.Instant voteStartAt;
    private java.time.Instant voteEndAt;
    private Integer voteRoundNumber;
    private List<PublicVoteItemDto> items = new ArrayList<>();

    public VotePageAuditionDto getAudition() {
        return audition;
    }

    public void setAudition(VotePageAuditionDto audition) {
        this.audition = audition;
    }

    public VotePageSummaryDto getSummary() {
        return summary;
    }

    public void setSummary(VotePageSummaryDto summary) {
        this.summary = summary;
    }

    public String getMyVoteApplicationId() {
        return myVoteApplicationId;
    }

    public void setMyVoteApplicationId(String myVoteApplicationId) {
        this.myVoteApplicationId = myVoteApplicationId;
    }

    public String getVoteStatus() { return voteStatus; }
    public void setVoteStatus(String voteStatus) { this.voteStatus = voteStatus; }
    public java.time.Instant getVoteStartAt() { return voteStartAt; }
    public void setVoteStartAt(java.time.Instant voteStartAt) { this.voteStartAt = voteStartAt; }
    public java.time.Instant getVoteEndAt() { return voteEndAt; }
    public void setVoteEndAt(java.time.Instant voteEndAt) { this.voteEndAt = voteEndAt; }
    public Integer getVoteRoundNumber() { return voteRoundNumber; }
    public void setVoteRoundNumber(Integer voteRoundNumber) { this.voteRoundNumber = voteRoundNumber; }

    public List<PublicVoteItemDto> getItems() {
        return items;
    }

    public void setItems(List<PublicVoteItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
