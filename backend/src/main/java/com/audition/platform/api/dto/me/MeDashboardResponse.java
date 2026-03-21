package com.audition.platform.api.dto.me;

import java.util.ArrayList;
import java.util.List;

public class MeDashboardResponse {

    private MeDashboardStatsDto stats = new MeDashboardStatsDto();
    private List<MyApplicationRecentDto> recentApplications = new ArrayList<>();

    public MeDashboardStatsDto getStats() {
        return stats;
    }

    public void setStats(MeDashboardStatsDto stats) {
        this.stats = stats;
    }

    public List<MyApplicationRecentDto> getRecentApplications() {
        return recentApplications;
    }

    public void setRecentApplications(List<MyApplicationRecentDto> recentApplications) {
        this.recentApplications = recentApplications;
    }
}
