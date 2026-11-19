package com.audition.platform.api;

import com.audition.platform.application.consent.MinorPolicyAdminService;
import com.audition.platform.application.consent.MinorPolicyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** 본사(슈퍼) 관리자: 국가별 미성년자 정책 · 동의/보호자 확인 현황 · 선발 이후 동의 요건(한국어 화면). */
@RestController
@RequestMapping("/api/admin/minor-policy")
public class SuperAdminMinorPolicyController {

    private final MinorPolicyAdminService admin;

    public SuperAdminMinorPolicyController(MinorPolicyAdminService admin) {
        this.admin = admin;
    }

    @GetMapping("/countries")
    public List<MinorPolicyService.Policy> countries() {
        return admin.list();
    }

    @PutMapping("/countries/{countryCode}")
    public MinorPolicyService.Policy upsert(@PathVariable String countryCode,
                                            @RequestBody MinorPolicyAdminService.PolicyInput body) {
        return admin.upsert(countryCode, body);
    }

    @GetMapping("/summary")
    public MinorPolicyAdminService.Summary summary() {
        return admin.summary();
    }

    @GetMapping("/users/{userId}")
    public MinorPolicyAdminService.UserConsents user(@PathVariable UUID userId) {
        return admin.user(userId);
    }

    @PostMapping("/guardians/{id}/revoke")
    public Map<String, Boolean> revoke(@PathVariable UUID id) {
        admin.revokeGuardian(id);
        return Map.of("ok", true);
    }

    @PostMapping("/requirements")
    public MinorPolicyAdminService.RequirementRow createRequirement(@RequestBody MinorPolicyAdminService.RequirementInput body) {
        return admin.createRequirement(body);
    }

    public record StatusBody(String status, String note) {
    }

    @PostMapping("/requirements/{id}/status")
    public Map<String, Boolean> requirementStatus(@PathVariable UUID id, @RequestBody StatusBody body) {
        admin.setRequirementStatus(id, body.status(), body.note());
        return Map.of("ok", true);
    }
}
