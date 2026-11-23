package com.audition.platform.api.dto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class VoteScheduleDto {

    private String voteStatus;
    private int roundNumber;
    private Instant voteStartAt;
    private Instant voteEndAt;
    private Instant voteStartedAt;
    private int candidateCount;
    private List<String> candidateApplicationIds = new ArrayList<>();

    public String getVoteStatus() { return voteStatus; }
    public void setVoteStatus(String voteStatus) { this.voteStatus = voteStatus; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
    public Instant getVoteStartAt() { return voteStartAt; }
    public void setVoteStartAt(Instant voteStartAt) { this.voteStartAt = voteStartAt; }
    public Instant getVoteEndAt() { return voteEndAt; }
    public void setVoteEndAt(Instant voteEndAt) { this.voteEndAt = voteEndAt; }
    public Instant getVoteStartedAt() { return voteStartedAt; }
    public void setVoteStartedAt(Instant voteStartedAt) { this.voteStartedAt = voteStartedAt; }
    public int getCandidateCount() { return candidateCount; }
    public void setCandidateCount(int candidateCount) { this.candidateCount = candidateCount; }
    public List<String> getCandidateApplicationIds() { return candidateApplicationIds; }
    public void setCandidateApplicationIds(List<String> candidateApplicationIds) {
        this.candidateApplicationIds = candidateApplicationIds != null ? candidateApplicationIds : new ArrayList<>();
    }
}
