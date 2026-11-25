package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

/** 지원자 본인 '내 투표 공유하기'. 확정 후보가 아니면 candidate=false 이고 링크 정보는 비운다. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MyVoteShareDto {
    private Integer candidateNumber;
    public Integer getCandidateNumber() { return candidateNumber; }
    public void setCandidateNumber(Integer candidateNumber) { this.candidateNumber = candidateNumber; }

    private boolean candidate;
    private String auditionId;
    private String auditionTitle;
    private String applicationId;
    private Integer roundNumber;
    private String voteStatus;
    private Instant voteStartAt;
    private Instant voteEndAt;

    public boolean isCandidate() { return candidate; }
    public void setCandidate(boolean candidate) { this.candidate = candidate; }
    public String getAuditionId() { return auditionId; }
    public void setAuditionId(String auditionId) { this.auditionId = auditionId; }
    public String getAuditionTitle() { return auditionTitle; }
    public void setAuditionTitle(String auditionTitle) { this.auditionTitle = auditionTitle; }
    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }
    public Integer getRoundNumber() { return roundNumber; }
    public void setRoundNumber(Integer roundNumber) { this.roundNumber = roundNumber; }
    public String getVoteStatus() { return voteStatus; }
    public void setVoteStatus(String voteStatus) { this.voteStatus = voteStatus; }
    public Instant getVoteStartAt() { return voteStartAt; }
    public void setVoteStartAt(Instant voteStartAt) { this.voteStartAt = voteStartAt; }
    public Instant getVoteEndAt() { return voteEndAt; }
    public void setVoteEndAt(Instant voteEndAt) { this.voteEndAt = voteEndAt; }
}
