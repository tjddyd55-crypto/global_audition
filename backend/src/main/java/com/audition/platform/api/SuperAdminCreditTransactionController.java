package com.audition.platform.api;

import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.application.credit.SuperAdminCreditAdministrationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping({"/api/admin/credit-transactions", "/api/admin/transactions"})
public class SuperAdminCreditTransactionController {

    private final SuperAdminCreditAdministrationService superAdminCreditAdministrationService;

    public SuperAdminCreditTransactionController(SuperAdminCreditAdministrationService superAdminCreditAdministrationService) {
        this.superAdminCreditAdministrationService = superAdminCreditAdministrationService;
    }

    @GetMapping
    public Page<CreditTransactionDto> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return superAdminCreditAdministrationService.listTransactions(userId, type, from, to, pageable);
    }
}
