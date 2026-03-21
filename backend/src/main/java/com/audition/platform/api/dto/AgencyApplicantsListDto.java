package com.audition.platform.api.dto;

import java.util.ArrayList;
import java.util.List;

public class AgencyApplicantsListDto {

    private List<AgencyApplicantItemDto> items = new ArrayList<>();

    public List<AgencyApplicantItemDto> getItems() {
        return items;
    }

    public void setItems(List<AgencyApplicantItemDto> items) {
        this.items = items;
    }
}
