package com.audition.platform.api;

import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.api.dto.PaymentCancelRequest;
import com.audition.platform.api.dto.TossConfirmRequest;
import com.audition.platform.application.payment.PaymentOrderService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class TossPaymentController {

    private final PaymentOrderService paymentOrderService;

    public TossPaymentController(PaymentOrderService paymentOrderService) {
        this.paymentOrderService = paymentOrderService;
    }

    @GetMapping("/public/checkout-hints")
    public Map<String, Object> checkoutHints() {
        return paymentOrderService.publicCheckoutHints();
    }

    @PostMapping("/toss/confirm")
    public CreditOrderSummaryResponse confirm(@Valid @RequestBody TossConfirmRequest body) {
        UUID userId = requireUserId();
        return paymentOrderService.confirmToss(
                userId,
                body.getPaymentKey(),
                body.getOrderId(),
                body.getAmount());
    }

    @PostMapping("/{orderNo}/cancel")
    public CreditOrderSummaryResponse cancel(
            @PathVariable String orderNo,
            @Valid @RequestBody PaymentCancelRequest body) {
        UUID userId = requireUserId();
        boolean superAdmin = SecurityUtils.hasRole("SUPER_ADMIN");
        return paymentOrderService.cancelToss(userId, orderNo, body.getReason(), superAdmin);
    }

    private static UUID requireUserId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
