package com.audition.platform.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ManageApplicationsPageDataDto {

    private ManageAuditionHeaderDto audition;
    private ManageApplicationStatsDto stats;
    private List<CategoryCountDto> categories = new ArrayList<>();
    private List<AgencyApplicantItemDto> items = new ArrayList<>();

    public ManageAuditionHeaderDto getAudition() {
        return audition;
    }

    public void setAudition(ManageAuditionHeaderDto audition) {
        this.audition = audition;
    }

    public ManageApplicationStatsDto getStats() {
        return stats;
    }

    public void setStats(ManageApplicationStatsDto stats) {
        this.stats = stats;
    }

    public List<CategoryCountDto> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryCountDto> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }

    public List<AgencyApplicantItemDto> getItems() {
        return items;
    }

    public void setItems(List<AgencyApplicantItemDto> items) {
        this.items = items != null ? items : new ArrayList<>();
    }
}
