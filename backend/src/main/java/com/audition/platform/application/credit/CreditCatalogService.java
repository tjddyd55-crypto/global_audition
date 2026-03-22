package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditPackageCatalogItemDto;
import com.audition.platform.api.dto.PreparePaymentResponse;
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

    private static final String CURRENCY_KRW = "KRW";
    private static final String STATUS_READY = "READY_FOR_PG";

    private final CreditPackageRepository creditPackageRepository;

    public CreditCatalogService(CreditPackageRepository creditPackageRepository) {
        this.creditPackageRepository = creditPackageRepository;
    }

    @Transactional(readOnly = true)
    public List<CreditPackageCatalogItemDto> listActivePackages() {
        return creditPackageRepository.findByActiveTrueOrderByPriceAsc().stream()
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

    /**
     * PG 사전 단계: 주문 ID 발급 및 금액 확정. 결제 게이트웨이 연동 시 orderId로 매칭하면 된다.
     */
    public PreparePaymentResponse preparePayment(UUID userId, UUID packageId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        CreditPackage p = getActivePackageOrThrow(packageId);
        PreparePaymentResponse r = new PreparePaymentResponse();
        r.setOrderId(UUID.randomUUID().toString());
        r.setPackageId(p.getId().toString());
        r.setPackageName(p.getName());
        r.setAmount(p.getPrice());
        r.setCredits(p.getCredits());
        r.setBonusCredits(p.getBonusCredits());
        r.setCurrency(CURRENCY_KRW);
        r.setStatus(STATUS_READY);
        r.setMessage("PG 연동 후 이 orderId로 결제를 시작할 수 있습니다. (현재는 크레딧이 충전되지 않습니다.)");
        return r;
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
