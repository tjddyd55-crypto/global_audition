package com.audition.platform.api;

import com.audition.platform.api.dto.AdminCreditAdjustRequest;
import com.audition.platform.api.dto.AdminCreditAdjustResponse;
import com.audition.platform.application.credit.SuperAdminCreditAdministrationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/credits")
public class SuperAdminCreditAdjustController {

    private final SuperAdminCreditAdministrationService superAdminCreditAdministrationService;

    public SuperAdminCreditAdjustController(SuperAdminCreditAdministrationService superAdminCreditAdministrationService) {
        this.superAdminCreditAdministrationService = superAdminCreditAdministrationService;
    }

    @PostMapping("/adjust")
    public AdminCreditAdjustResponse adjust(@Valid @RequestBody AdminCreditAdjustRequest request) {
        return superAdminCreditAdministrationService.adjust(request);
    }
}
