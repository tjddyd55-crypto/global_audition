package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RankingPageDataDto {

    private List<RankingItemDto> items = new ArrayList<>();

    public List<RankingItemDto> getItems() {
        return items;
    }

    public void setItems(List<RankingItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
