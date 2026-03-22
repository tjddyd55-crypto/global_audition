package com.audition.platform.api;

import com.audition.platform.api.dto.CreditPackageCatalogItemDto;
import com.audition.platform.application.credit.CreditCatalogService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/credit-packages")
public class CreditPackageCatalogController {

    private final CreditCatalogService creditCatalogService;

    public CreditPackageCatalogController(CreditCatalogService creditCatalogService) {
        this.creditCatalogService = creditCatalogService;
    }

    @GetMapping
    public List<CreditPackageCatalogItemDto> listActive() {
        return creditCatalogService.listActivePackages();
    }

    @GetMapping("/{id}")
    public CreditPackageCatalogItemDto getActive(@PathVariable("id") String id) {
        UUID packageId;
        try {
            packageId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 패키지 ID입니다.");
        }
        return creditCatalogService.getActivePackageDto(packageId);
    }
}
