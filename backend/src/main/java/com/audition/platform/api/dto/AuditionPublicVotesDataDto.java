package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuditionPublicVotesDataDto {

    private long totalVotes;
    private String myVote;
    private List<PublicVoteItemDto> items = new ArrayList<>();

    public long getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(long totalVotes) {
        this.totalVotes = totalVotes;
    }

    public String getMyVote() {
        return myVote;
    }

    public void setMyVote(String myVote) {
        this.myVote = myVote;
    }

    public List<PublicVoteItemDto> getItems() {
        return items;
    }

    public void setItems(List<PublicVoteItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
