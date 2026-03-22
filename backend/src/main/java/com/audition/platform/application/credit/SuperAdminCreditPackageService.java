package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditPackageResponse;
import com.audition.platform.api.dto.CreditPackageUpsertRequest;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SuperAdminCreditPackageService {

    private final CreditPackageRepository creditPackageRepository;

    public SuperAdminCreditPackageService(CreditPackageRepository creditPackageRepository) {
        this.creditPackageRepository = creditPackageRepository;
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
        applyBody(p, body);
        p.setUpdatedAt(Instant.now());
        p = creditPackageRepository.save(p);
        return toDto(p);
    }

    @Transactional
    public CreditPackageResponse update(UUID id, CreditPackageUpsertRequest body) {
        SuperAdminAuthHelper.requireSuperAdmin();
        CreditPackage p = creditPackageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        applyBody(p, body);
        p.setUpdatedAt(Instant.now());
        p = creditPackageRepository.save(p);
        return toDto(p);
    }

    @Transactional
    public void delete(UUID id) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (!creditPackageRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다.");
        }
        creditPackageRepository.deleteById(id);
    }

    private static void applyBody(CreditPackage p, CreditPackageUpsertRequest body) {
        p.setName(body.getName().trim());
        p.setPrice(body.getPrice());
        p.setCredits(body.getCredits());
        p.setBonusCredits(body.getBonusCredits());
        p.setActive(Boolean.TRUE.equals(body.getActive()));
    }

    private static CreditPackageResponse toDto(CreditPackage p) {
        CreditPackageResponse r = new CreditPackageResponse();
        r.setId(p.getId().toString());
        r.setName(p.getName());
        r.setPrice(p.getPrice());
        r.setCredits(p.getCredits());
        r.setBonusCredits(p.getBonusCredits());
        r.setActive(p.isActive());
        r.setUpdatedAt(p.getUpdatedAt());
        return r;
    }
}
