package com.audition.platform.api;

import com.audition.platform.api.dto.AgencyDashboardResponse;
import com.audition.platform.api.dto.ApplicantDashboardResponse;
import com.audition.platform.application.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/agency")
    public AgencyDashboardResponse agency() {
        return dashboardService.getAgencyDashboard();
    }

    @GetMapping("/applicant")
    public ApplicantDashboardResponse applicant() {
        return dashboardService.getApplicantDashboard();
    }
}
