package com.audition.platform.api.dto;

public class VotePageSummaryDto {

    private long applicantCount;
    private long totalVotes;
    private long totalViewCount;
    private int myVoteCount;

    public long getApplicantCount() {
        return applicantCount;
    }

    public void setApplicantCount(long applicantCount) {
        this.applicantCount = applicantCount;
    }

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public long getTotalViewCount() {
        return totalViewCount;
    }

    public void setTotalViewCount(long totalViewCount) {
        this.totalViewCount = totalViewCount;
    }

    public int getMyVoteCount() {
        return myVoteCount;
    }

    public void setMyVoteCount(int myVoteCount) {
        this.myVoteCount = myVoteCount;
    }
}
