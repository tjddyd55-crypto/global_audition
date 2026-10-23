package com.audition.platform.api;

import com.audition.platform.application.payment.PaymentService;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class GlobalPaymentController {

    private final PaymentService paymentService;

    public GlobalPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/methods")
    public List<Map<String, Object>> methods(@RequestParam String paymentCountry) {
        return paymentService.availableMethods(paymentCountry);
    }

    @PostMapping("/quote")
    public Map<String, Object> quote(@RequestBody QuoteRequest body) {
        return paymentService.quote(body.packageId(), body.paymentCountry(), body.providerId(), body.methodCode());
    }

    @PostMapping("/orders")
    public Map<String, Object> create(@RequestBody CreateOrderRequest body) {
        return paymentService.createOrder(
                requireUser(), body.packageId(), body.paymentCountry(), body.providerId(), body.methodCode(), body.idempotencyKey());
    }

    @GetMapping("/orders/mine")
    public List<Map<String, Object>> mine() {
        return paymentService.myOrders(requireUser());
    }

    @GetMapping("/orders/{orderNo}")
    public Map<String, Object> order(@PathVariable String orderNo) {
        return paymentService.myOrder(requireUser(), orderNo);
    }

    @PostMapping("/orders/{orderNo}/confirm")
    public Map<String, Object> confirm(@PathVariable String orderNo, @RequestBody ConfirmRequest body) {
        return paymentService.confirm(requireUser(), orderNo, body.scenario(), body.chargeAmountMinor(), body.paymentKey());
    }

    @PostMapping("/orders/{orderNo}/cancel")
    public Map<String, Object> cancel(@PathVariable String orderNo) {
        return paymentService.cancel(requireUser(), orderNo);
    }

    @PostMapping("/orders/{orderNo}/refund")
    public Map<String, Object> refund(@PathVariable String orderNo, @RequestBody RefundRequest body) {
        boolean superAdmin = SecurityUtils.hasRole("SUPER_ADMIN");
        return paymentService.refund(requireUser(), orderNo, body.amountMinor(), body.idempotencyKey(), superAdmin);
    }

    @PostMapping("/webhooks/{providerId}")
    public Map<String, Object> webhook(
            @PathVariable String providerId,
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Payment-Signature", required = false) String signature) {
        return paymentService.receiveWebhook(providerId, rawBody, signature);
    }

    private static UUID requireUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }

    public record QuoteRequest(UUID packageId, String paymentCountry, String providerId, String methodCode) {
    }

    public record CreateOrderRequest(
            UUID packageId, String paymentCountry, String providerId, String methodCode, String idempotencyKey) {
    }

    public record ConfirmRequest(String scenario, Long chargeAmountMinor, String paymentKey) {
    }

    public record RefundRequest(long amountMinor, String idempotencyKey) {
    }
}
