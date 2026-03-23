package com.audition.platform.api;

import com.audition.platform.api.dto.CreditBalanceResponse;
import com.audition.platform.api.dto.CreditChargeRequest;
import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.api.dto.PreparePaymentRequest;
import com.audition.platform.api.dto.PreparePaymentResponse;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.payment.PaymentOrderService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditService creditService;
    private final PaymentOrderService paymentOrderService;

    public CreditController(CreditService creditService, PaymentOrderService paymentOrderService) {
        this.creditService = creditService;
        this.paymentOrderService = paymentOrderService;
    }

    @GetMapping("/balance")
    public CreditBalanceResponse getBalance() {
        UUID userId = requireUserId();
        return new CreditBalanceResponse(creditService.getBalance(userId));
    }

    @GetMapping("/transactions")
    public Page<CreditTransactionDto> listMyTransactions(@PageableDefault(size = 20) Pageable pageable) {
        UUID userId = requireUserId();
        return creditService.listMyTransactions(userId, pageable);
    }

    @PostMapping("/charge")
    public CreditBalanceResponse charge(@Valid @RequestBody CreditChargeRequest request) {
        UUID userId = requireUserId();
        long balance = creditService.chargeCredits(userId, request.getAmount());
        return new CreditBalanceResponse(balance);
    }

    @PostMapping("/prepare-payment")
    public PreparePaymentResponse preparePayment(@Valid @RequestBody PreparePaymentRequest request) {
        UUID userId = requireUserId();
        UUID packageId;
        try {
            packageId = UUID.fromString(request.getPackageId().trim());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 packageId입니다.");
        }
        return paymentOrderService.preparePayment(userId, packageId, request.getProvider());
    }

    @GetMapping("/orders/{orderNo}")
    public CreditOrderSummaryResponse getOrder(@PathVariable String orderNo) {
        UUID userId = requireUserId();
        return paymentOrderService.getOrderForUser(orderNo.trim(), userId);
    }

    private static UUID requireUserId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
