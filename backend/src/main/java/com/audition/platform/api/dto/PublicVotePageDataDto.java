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

    public List<PublicVoteItemDto> getItems() {
        return items;
    }

    public void setItems(List<PublicVoteItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
