package com.audition.platform.api;

import com.audition.platform.api.dto.AdminCreditBulkGrantRequest;
import com.audition.platform.api.dto.AdminCreditBulkGrantResponse;
import com.audition.platform.api.dto.AdminCreditGrantRequest;
import com.audition.platform.api.dto.AdminCreditGrantResponse;
import com.audition.platform.application.credit.SuperAdminCreditGrantService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/credits")
public class SuperAdminCreditGrantController {

    private final SuperAdminCreditGrantService superAdminCreditGrantService;

    public SuperAdminCreditGrantController(SuperAdminCreditGrantService superAdminCreditGrantService) {
        this.superAdminCreditGrantService = superAdminCreditGrantService;
    }

    @PostMapping("/grant")
    public AdminCreditGrantResponse grant(@Valid @RequestBody AdminCreditGrantRequest request) {
        return superAdminCreditGrantService.grant(request);
    }

    @PostMapping("/grant/bulk")
    public AdminCreditBulkGrantResponse grantBulk(@Valid @RequestBody AdminCreditBulkGrantRequest request) {
        return superAdminCreditGrantService.grantBulk(request);
    }
}
