package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RankingPageDataDto {

    private List<RankingItemDto> items = new ArrayList<>();
    /** 현재 회차 투표(랭킹) 사용 여부. false 면 items 는 비어 있다. */
    private boolean votingEnabled = true;
    private int roundNumber = 1;

    public boolean isVotingEnabled() { return votingEnabled; }
    public void setVotingEnabled(boolean votingEnabled) { this.votingEnabled = votingEnabled; }
    public int getRoundNumber() { return roundNumber; }
    public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }

    public List<RankingItemDto> getItems() {
        return items;
    }

    public void setItems(List<RankingItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
