package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditPackageCatalogItemDto;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CreditCatalogService {

    private final CreditPackageRepository creditPackageRepository;

    public CreditCatalogService(CreditPackageRepository creditPackageRepository) {
        this.creditPackageRepository = creditPackageRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditPackageCatalogItemDto> listActivePackages() {
        return creditPackageRepository.findByActiveTrueOrderBySortOrderAscPriceAsc().stream()
                .map(CreditCatalogService::toCatalogItem)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CreditPackage getActivePackageOrThrow(UUID packageId) {
        CreditPackage p = creditPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        if (!p.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 중이 아닌 패키지입니다.");
        }
        return p;
    }

    @Transactional(readOnly = true)
    public CreditPackageCatalogItemDto getActivePackageDto(UUID packageId) {
        return toCatalogItem(getActivePackageOrThrow(packageId));
    }

    private static CreditPackageCatalogItemDto toCatalogItem(CreditPackage p) {
        CreditPackageCatalogItemDto d = new CreditPackageCatalogItemDto();
        d.setId(p.getId().toString());
        d.setName(p.getName());
        d.setPrice(p.getPrice());
        d.setCredits(p.getCredits());
        d.setBonusCredits(p.getBonusCredits());
        return d;
    }
}
