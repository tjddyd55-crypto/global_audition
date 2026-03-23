package com.audition.platform.api;

import com.audition.platform.api.dto.PaymentOrderAdminDto;
import com.audition.platform.application.payment.SuperAdminPaymentOrderQueryService;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payment-orders")
public class SuperAdminPaymentOrderController {

    private final SuperAdminPaymentOrderQueryService superAdminPaymentOrderQueryService;

    public SuperAdminPaymentOrderController(SuperAdminPaymentOrderQueryService superAdminPaymentOrderQueryService) {
        this.superAdminPaymentOrderQueryService = superAdminPaymentOrderQueryService;
    }

    @GetMapping
    public Page<PaymentOrderAdminDto> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) PaymentOrderStatus status,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return superAdminPaymentOrderQueryService.list(userId, status, pageable);
    }
}
