package com.audition.platform.application.credit;

import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.api.dto.CreditPackageResponse;
import com.audition.platform.api.dto.CreditPackageUpsertRequest;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SuperAdminCreditPackageService {

    private final CreditPackageRepository creditPackageRepository;
    private final AdminAuditLogService adminAuditLogService;

    public SuperAdminCreditPackageService(
            CreditPackageRepository creditPackageRepository,
            AdminAuditLogService adminAuditLogService) {
        this.creditPackageRepository = creditPackageRepository;
        this.adminAuditLogService = adminAuditLogService;
    }

    @Transactional(readOnly = true)
    public List<CreditPackageResponse> listAll() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return creditPackageRepository.findAll().stream()
                .map(SuperAdminCreditPackageService::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CreditPackageResponse create(CreditPackageUpsertRequest body) {
        SuperAdminAuthHelper.requireSuperAdmin();
        CreditPackage p = new CreditPackage();
        Instant now = Instant.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        applyBody(p, body);
        p = creditPackageRepository.save(p);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.CREDIT_PACKAGE_CREATE,
                    "CREDIT_PACKAGE",
                    p.getId().toString(),
                    Map.of(),
                    packageSnapshot(p));
        }
        return toDto(p);
    }

    @Transactional
    public CreditPackageResponse update(UUID id, CreditPackageUpsertRequest body) {
        SuperAdminAuthHelper.requireSuperAdmin();
        CreditPackage p = creditPackageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        Map<String, Object> before = packageSnapshot(p);
        applyBody(p, body);
        p.setUpdatedAt(Instant.now());
        p = creditPackageRepository.save(p);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.CREDIT_PACKAGE_UPDATE,
                    "CREDIT_PACKAGE",
                    p.getId().toString(),
                    before,
                    packageSnapshot(p));
        }
        return toDto(p);
    }

    @Transactional
    public void delete(UUID id) {
        SuperAdminAuthHelper.requireSuperAdmin();
        CreditPackage p = creditPackageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        Map<String, Object> before = packageSnapshot(p);
        creditPackageRepository.deleteById(id);
        UUID adminId = SecurityUtils.getCurrentUserId();
        if (adminId != null) {
            adminAuditLogService.log(
                    adminId,
                    AdminAuditAction.CREDIT_PACKAGE_DELETE,
                    "CREDIT_PACKAGE",
                    id.toString(),
                    before,
                    Map.of());
        }
    }

    private static void applyBody(CreditPackage p, CreditPackageUpsertRequest body) {
        p.setName(body.getName().trim());
        p.setPrice(body.getPrice());
        p.setCredits(body.getCredits());
        p.setBonusCredits(body.getBonusCredits());
        p.setActive(Boolean.TRUE.equals(body.getActive()));
        p.setSortOrder(body.sortOrderOrDefault());
    }

    private static Map<String, Object> packageSnapshot(CreditPackage p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId().toString());
        m.put("name", p.getName());
        m.put("price", p.getPrice());
        m.put("credits", p.getCredits());
        m.put("bonusCredits", p.getBonusCredits());
        m.put("active", p.isActive());
        m.put("sortOrder", p.getSortOrder());
        m.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null);
        return m;
    }

    private static CreditPackageResponse toDto(CreditPackage p) {
        CreditPackageResponse r = new CreditPackageResponse();
        r.setId(p.getId().toString());
        r.setName(p.getName());
        r.setPrice(p.getPrice());
        r.setCredits(p.getCredits());
        r.setBonusCredits(p.getBonusCredits());
        r.setActive(p.isActive());
        r.setSortOrder(p.getSortOrder());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
