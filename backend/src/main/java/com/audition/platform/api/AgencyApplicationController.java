package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.application.org.CrmService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/agency-application")
public class AgencyApplicationController {

    private final CrmService crm;

    public AgencyApplicationController(CrmService crm) {
        this.crm = crm;
    }

    @GetMapping
    public ApiEnvelope<CrmService.AgencyApplicationView> mine() {
        return ApiEnvelope.ok(crm.myApplication());
    }
}
