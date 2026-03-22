package com.audition.platform.api;

import com.audition.platform.api.dto.CreditPolicyPatchRequest;
import com.audition.platform.api.dto.CreditPolicyResponse;
import com.audition.platform.application.credit.AdminCreditPolicyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/credit-policies")
public class AdminCreditPolicyController {

    private final AdminCreditPolicyService adminCreditPolicyService;

    public AdminCreditPolicyController(AdminCreditPolicyService adminCreditPolicyService) {
        this.adminCreditPolicyService = adminCreditPolicyService;
    }

    @GetMapping
    public List<CreditPolicyResponse> list() {
        return adminCreditPolicyService.listPolicies();
    }

    @PatchMapping("/{policyKey}")
    public CreditPolicyResponse patch(
            @PathVariable("policyKey") String policyKey,
            @Valid @RequestBody CreditPolicyPatchRequest request) {
        return adminCreditPolicyService.patchPolicy(policyKey, request);
    }
}
