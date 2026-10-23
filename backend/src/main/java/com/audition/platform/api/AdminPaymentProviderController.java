package com.audition.platform.api;

import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.payment.PaymentCatalogStore;
import com.audition.platform.application.payment.PaymentService;
import com.audition.platform.application.payment.TestRevenuePreviewService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/payment-providers")
public class AdminPaymentProviderController {

    private final PaymentService paymentService;
    private final TestRevenuePreviewService testRevenue;

    public AdminPaymentProviderController(PaymentService paymentService, TestRevenuePreviewService testRevenue) {
        this.paymentService = paymentService;
        this.testRevenue = testRevenue;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return paymentService.providerViews();
    }

    @PatchMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody ProviderPatch body) {
        return paymentService.updateProvider(id, body.environment(), body.contractStatus(), body.enabled());
    }

    @PostMapping("/{id}/secrets")
    public Map<String, Object> secrets(@PathVariable String id, @RequestBody SecretBody body) {
        return paymentService.rotateSecret(
                id, body.environment(), body.clientKey(), body.clientId(), body.secret(), body.merchantId(), body.webhookSecret());
    }

    @GetMapping("/{id}/secrets")
    public Map<String, Object> secretView(@PathVariable String id, @RequestParam String environment) {
        return paymentService.credentialView(id, environment);
    }

    @PostMapping("/{id}/connection-test")
    public Map<String, Object> connection(@PathVariable String id) {
        return paymentService.testConnection(id);
    }

    @GetMapping("/methods")
    public List<PaymentCatalogStore.MethodRow> methods() {
        return paymentService.allMethods();
    }

    @PatchMapping("/methods/{methodId}")
    public void method(@PathVariable UUID methodId, @RequestBody MethodPatch body) {
        paymentService.setMethodEnabled(methodId, body.enabled());
    }

    @GetMapping("/fx")
    public List<PaymentCatalogStore.FxRow> fx(@RequestParam String currency) {
        return paymentService.fxHistory(currency);
    }

    @PostMapping("/fx")
    public Map<String, Object> addFx(@RequestBody FxBody body) {
        return paymentService.addFx(body.chargeCurrency(), body.rate(), body.basis(), body.roundingMode(), body.effectiveFrom());
    }

    @GetMapping("/webhooks")
    public List<PaymentCatalogStore.WebhookLogRow> webhooks() {
        return paymentService.webhooks();
    }

    @GetMapping("/errors")
    public List<PaymentCatalogStore.ErrorLogRow> errors() {
        return paymentService.errors();
    }

    @GetMapping("/audit")
    public List<Map<String, Object>> audit() {
        return paymentService.paymentAdminHistory();
    }

    @GetMapping("/orders")
    public List<PaymentCatalogStore.OrderAdminRow> orders(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String environment,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        return paymentService.searchOrders(q, environment, status, from, to);
    }

    @GetMapping("/orders/{orderNo}")
    public Map<String, Object> order(@PathVariable String orderNo) {
        return paymentService.orderDetail(orderNo);
    }

    @GetMapping("/refunds")
    public List<PaymentCatalogStore.RefundAdminRow> refunds() {
        return paymentService.refunds();
    }

    @PostMapping("/orders/{orderNo}/refund")
    public Map<String, Object> refund(@PathVariable String orderNo, @RequestBody RefundBody body) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return paymentService.refund(
                com.audition.platform.infra.SecurityUtils.getCurrentUserId(),
                orderNo,
                body.amountMinor(),
                body.idempotencyKey(),
                true);
    }

    @PostMapping("/errors/{errorId}/reprocess")
    public Map<String, Object> reprocess(@PathVariable UUID errorId, @RequestBody ReprocessBody body) {
        return paymentService.reprocessError(errorId, body.scenario());
    }

    @GetMapping("/test-user")
    public PaymentCatalogStore.UserRef testUser(@RequestParam String email) {
        return paymentService.testUser(email);
    }

    @PostMapping("/mock-test")
    public Map<String, Object> mockTest(@RequestBody MockTestBody body) {
        return paymentService.runAdminMockTest(body.email(), body.packageId(), body.paymentCountry(), body.scenario());
    }

    @GetMapping("/test-revenue")
    public Map<String, Object> testRevenue(
            @RequestParam String country,
            @RequestParam UUID contractId,
            @RequestParam Instant from,
            @RequestParam Instant to) {
        return testRevenue.preview(country, contractId, from, to);
    }

    public record ProviderPatch(String environment, String contractStatus, Boolean enabled) {
    }

    public record SecretBody(
            String environment, String clientKey, String clientId, String secret, String merchantId, String webhookSecret) {
    }

    public record MethodPatch(boolean enabled) {
    }

    public record FxBody(String chargeCurrency, BigDecimal rate, String basis, String roundingMode, Instant effectiveFrom) {
    }

    public record RefundBody(long amountMinor, String idempotencyKey) {
    }

    public record ReprocessBody(String scenario) {
    }

    public record MockTestBody(String email, UUID packageId, String paymentCountry, String scenario) {
    }
}
