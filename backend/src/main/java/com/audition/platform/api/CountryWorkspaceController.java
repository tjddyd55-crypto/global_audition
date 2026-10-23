package com.audition.platform.api;

import com.audition.platform.application.org.CountryWorkspaceService;
import com.audition.platform.application.org.CountryWorkspaceService.AccountPrefs;
import com.audition.platform.application.org.CountryWorkspaceService.AuditionOps;
import com.audition.platform.application.org.CountryWorkspaceService.Metrics;
import com.audition.platform.application.org.CountryWorkspaceService.UsagePoint;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/org/workspace")
public class CountryWorkspaceController {

    private final CountryWorkspaceService workspace;

    public CountryWorkspaceController(CountryWorkspaceService workspace) {
        this.workspace = workspace;
    }

    @GetMapping("/overview")
    public List<Metrics> overview(@RequestParam(required = false) String period) {
        return workspace.overview(period);
    }

    @GetMapping("/metrics")
    public Metrics metrics(@RequestParam String country, @RequestParam(required = false) String period) {
        return workspace.metrics(country, period);
    }

    @GetMapping("/auditions")
    public List<AuditionOps> auditions(@RequestParam String country) {
        return workspace.auditions(country);
    }

    @GetMapping("/usage")
    public List<UsagePoint> usage(@RequestParam String country, @RequestParam(required = false) String period) {
        return workspace.usage(country, period);
    }

    @GetMapping("/account")
    public AccountPrefs account() {
        return workspace.account();
    }

    @PutMapping("/account")
    public AccountPrefs saveAccount(@RequestBody AccountRequest request) {
        return workspace.saveAccount(request.emailEnabled(), request.locale());
    }

    public record AccountRequest(Boolean emailEnabled, String locale) {
    }
}
