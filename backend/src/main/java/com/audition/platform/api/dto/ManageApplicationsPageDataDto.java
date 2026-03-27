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

    /** 전체 지원자 수(해당 오디션, 라운드 필터 전) */
    private long applicantTotalCount;
    /** 탭 구성용 상한 차수 (1부터 maxRound 탭) */
    private int maxRound;
    /** 차수별 인원 (round 1..maxRound, count 0인 차수도 포함 가능) */
    private List<ManageRoundCountDto> roundCounts = new ArrayList<>();

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

    public long getApplicantTotalCount() {
        return applicantTotalCount;
    }

    public void setApplicantTotalCount(long applicantTotalCount) {
        this.applicantTotalCount = applicantTotalCount;
    }

    public int getMaxRound() {
        return maxRound;
    }

    public void setMaxRound(int maxRound) {
        this.maxRound = maxRound;
    }

    public List<ManageRoundCountDto> getRoundCounts() {
        return roundCounts;
    }

    public void setRoundCounts(List<ManageRoundCountDto> roundCounts) {
        this.roundCounts = roundCounts != null ? roundCounts : new ArrayList<>();
    }
}
