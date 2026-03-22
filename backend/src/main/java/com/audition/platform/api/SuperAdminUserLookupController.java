package com.audition.platform.api;

import com.audition.platform.api.dto.UserCreditLookupDto;
import com.audition.platform.application.credit.SuperAdminCreditAdministrationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class SuperAdminUserLookupController {

    private final SuperAdminCreditAdministrationService superAdminCreditAdministrationService;

    public SuperAdminUserLookupController(SuperAdminCreditAdministrationService superAdminCreditAdministrationService) {
        this.superAdminCreditAdministrationService = superAdminCreditAdministrationService;
    }

    @GetMapping("/lookup")
    public UserCreditLookupDto lookup(@RequestParam("q") String q) {
        return superAdminCreditAdministrationService.lookupUser(q);
    }
}
