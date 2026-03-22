package com.audition.platform.api;

import com.audition.platform.api.dto.CreditPackageResponse;
import com.audition.platform.api.dto.CreditPackageUpsertRequest;
import com.audition.platform.application.credit.SuperAdminCreditPackageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/credit-packages")
public class SuperAdminCreditPackageController {

    private final SuperAdminCreditPackageService superAdminCreditPackageService;

    public SuperAdminCreditPackageController(SuperAdminCreditPackageService superAdminCreditPackageService) {
        this.superAdminCreditPackageService = superAdminCreditPackageService;
    }

    @GetMapping
    public List<CreditPackageResponse> list() {
        return superAdminCreditPackageService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditPackageResponse create(@Valid @RequestBody CreditPackageUpsertRequest body) {
        return superAdminCreditPackageService.create(body);
    }

    @PutMapping("/{id}")
    public CreditPackageResponse update(@PathVariable UUID id, @Valid @RequestBody CreditPackageUpsertRequest body) {
        return superAdminCreditPackageService.update(id, body);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        superAdminCreditPackageService.delete(id);
    }
}
