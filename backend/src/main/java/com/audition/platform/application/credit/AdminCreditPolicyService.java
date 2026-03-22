package com.audition.platform.application.credit;

import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.api.dto.CreditPolicyPatchRequest;
import com.audition.platform.api.dto.CreditPolicyResponse;
import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.audition.platform.infra.SecurityUtils;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminCreditPolicyService {

    private final CreditPolicyRepository creditPolicyRepository;
    private final AdminAuditLogService adminAuditLogService;

    public AdminCreditPolicyService(
            CreditPolicyRepository creditPolicyRepository,
            AdminAuditLogService adminAuditLogService) {
        this.creditPolicyRepository = creditPolicyRepository;
        this.adminAuditLogService = adminAuditLogService;
    }

    private static void assertSuperAdmin() {
        SuperAdminAuthHelper.requireSuperAdmin();
    }

    private static CreditPolicyResponse toDto(CreditPolicy p) {
        CreditPolicyResponse dto = new CreditPolicyResponse();
        dto.setKey(p.getPolicyKey());
        dto.setCost(p.getCost());
        dto.setActive(p.isActive());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<CreditPolicyResponse> listPolicies() {
        assertSuperAdmin();
        return creditPolicyRepository.findAll().stream()
                .map(AdminCreditPolicyService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreditPolicyResponse patchPolicy(String policyKey, CreditPolicyPatchRequest body) {
        assertSuperAdmin();
        if (body.getCost() == null && body.getActive() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수정할 필드(cost 또는 active)가 필요합니다.");
        }
        CreditPolicy policy = creditPolicyRepository.findById(policyKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "크레딧 정책을 찾을 수 없습니다."));
        Map<String, Object> before = policySnapshot(policyKey, policy);
        if (body.getCost() != null) {
            policy.setCost(body.getCost());
        }
        if (body.getActive() != null) {
            policy.setActive(body.getActive());
        }
        policy.setUpdatedAt(Instant.now());
        creditPolicyRepository.save(policy);
        Map<String, Object> after = policySnapshot(policyKey, policy);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.CREDIT_POLICY_PATCH,
                    "CREDIT_POLICY",
                    policyKey,
                    before,
                    after);
        }
        return toDto(policy);
    }

    private static Map<String, Object> policySnapshot(String policyKey, CreditPolicy p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("policyKey", policyKey);
        m.put("cost", p.getCost());
        m.put("active", p.isActive());
        m.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        return m;
    }
}
