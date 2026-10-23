package com.audition.platform.application.payment;

import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.application.payment.PaymentCatalogStore.FxRow;
import com.audition.platform.application.payment.PaymentCatalogStore.MethodRow;
import com.audition.platform.application.payment.PaymentCatalogStore.ProviderRow;
import com.audition.platform.application.payment.PaymentCatalogStore.SecretRow;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayConfirm;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayRefund;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewaySession;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayWebhook;
import com.audition.platform.application.payment.gateway.GatewayTypes.Outcome;
import com.audition.platform.application.payment.gateway.PaymentGateway;
import com.audition.platform.application.payment.gateway.PaymentGatewayException;
import com.audition.platform.application.payment.gateway.PaymentProviderRegistry;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import com.audition.platform.infra.SecurityUtils;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * 결제 국가와 사용 가능한 PG로 주문을 만들고, 크레딧 원장은 기존 {@link CreditService}에만 연결한다.
 * 실적 귀속 국가는 여기서 정하지 않는다.
 */
@Service
public class PaymentService {

    private final PaymentCatalogStore catalog;
    private final PaymentProviderRegistry registry;
    private final PaymentOrderRepository orders;
    private final CreditPackageRepository packages;
    private final CreditService credits;
    private final SettingsSecretCrypto crypto;
    private final PaymentEnvironmentGuard guard;
    private final AdminAuditLogService audit;
    private final TossPaymentsClient tossPaymentsClient;
    private final EntityManager entityManager;
    private final SecureRandom random = new SecureRandom();

    public PaymentService(
            PaymentCatalogStore catalog,
            PaymentProviderRegistry registry,
            PaymentOrderRepository orders,
            CreditPackageRepository packages,
            CreditService credits,
            SettingsSecretCrypto crypto,
            PaymentEnvironmentGuard guard,
            AdminAuditLogService audit,
            TossPaymentsClient tossPaymentsClient,
            EntityManager entityManager) {
        this.catalog = catalog;
        this.registry = registry;
        this.orders = orders;
        this.packages = packages;
        this.credits = credits;
        this.crypto = crypto;
        this.guard = guard;
        this.audit = audit;
        this.tossPaymentsClient = tossPaymentsClient;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> providerViews() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.providers().stream().map(this::providerView).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> availableMethods(String paymentCountry) {
        requireUser();
        String country = iso2(paymentCountry);
        return catalog.methods().stream()
                .filter(row -> country.equals(row.paymentCountry()))
                .filter(this::offerAvailable)
                .map(this::methodView)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> quote(UUID packageId, String paymentCountry, String providerId, String methodCode) {
        requireUser();
        MethodRow method = requireAvailableMethod(paymentCountry, providerId, methodCode);
        CreditPackage pkg = activePackage(packageId);
        long issued = issuedCredits(pkg);
        FxQuote fx = quoteFx(method.currency(), issued, Instant.now());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("credits", issued);
        body.put("chargeCurrency", method.currency());
        body.put("chargeAmountMinor", fx.minor());
        body.put("scale", MoneyMinor.scale(method.currency()));
        body.put("fxRate", fx.rate().toPlainString());
        body.put("fxRateId", fx.rateId() == null ? null : fx.rateId().toString());
        body.put("providerId", method.providerId());
        body.put("methodCode", method.methodCode());
        body.put("paymentCountry", method.paymentCountry());
        body.put("merchantCountry", method.merchantCountry());
        body.put("environment", method.environment());
        return body;
    }

    @Transactional
    public Map<String, Object> createOrder(
            UUID userId, UUID packageId, String paymentCountry, String providerId, String methodCode, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            PaymentOrder existing = orders.findByUserIdAndIdempotencyKey(userId, idempotencyKey.trim()).orElse(null);
            if (existing != null) {
                return orderView(existing);
            }
        }
        MethodRow method = requireAvailableMethod(paymentCountry, providerId, methodCode);
        ProviderRow provider = catalog.provider(method.providerId()).orElseThrow();
        assertExecutable(provider);
        CreditPackage pkg = activePackage(packageId);
        long issued = issuedCredits(pkg);
        Instant now = Instant.now();
        FxQuote fx = quoteFx(method.currency(), issued, now);
        PaymentGateway gateway = registry.require(provider.adapterCode());
        PaymentOrder order = new PaymentOrder();
        order.setOrderNo("ORD-" + UUID.randomUUID().toString().replace("-", ""));
        order.setUserId(userId);
        order.setPackageId(pkg.getId());
        order.setProvider(provider.adapterCode());
        order.setProviderConfigId(provider.id());
        order.setMethodCode(method.methodCode());
        order.setAmount(BigDecimal.valueOf(issued));
        order.setCurrency("USD");
        order.setStatus(PaymentOrderStatus.CREATED);
        order.setCredits(pkg.getCredits());
        order.setBonusCredits(pkg.getBonusCredits());
        order.setCreditsIssued(issued);
        order.setEnvironment(provider.environment());
        order.setPaymentCountry(method.paymentCountry());
        order.setChargeCurrency(method.currency());
        order.setChargeAmountMinor(fx.minor());
        order.setFxRate(fx.rate());
        order.setFxRateId(fx.rateId());
        order.setIdempotencyKey(idempotencyKey == null || idempotencyKey.isBlank() ? null : idempotencyKey.trim());
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        orders.save(order);
        GatewaySession session;
        try {
            session = gateway.createSession(order, context(provider));
        } catch (PaymentGatewayException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        order.setStatus(PaymentOrderStatus.READY);
        order.setUpdatedAt(Instant.now());
        orders.save(order);
        Map<String, Object> view = orderView(order);
        view.put("redirectPath", session.redirectPath());
        if (session.clientKey() != null) {
            view.put("clientKey", session.clientKey());
        }
        return view;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Map<String, Object> confirm(UUID userId, String orderNo, String scenario, Long clientMinor, String paymentKey) {
        PaymentOrder order = lockOwned(userId, orderNo);
        if (order.getChargeAmountMinor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CHARGE_AMOUNT_MISSING");
        }
        if (clientMinor == null || clientMinor.longValue() != order.getChargeAmountMinor()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AMOUNT_MISMATCH");
        }
        if (order.getStatus() == PaymentOrderStatus.PAID) {
            return orderView(order);
        }
        if (order.getStatus() != PaymentOrderStatus.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ORDER_NOT_CONFIRMABLE");
        }
        ProviderRow provider = requireProvider(order.getProviderConfigId());
        assertExecutable(provider);
        PaymentGateway gateway = registry.require(provider.adapterCode());
        GatewayConfirm result;
        try {
            result = gateway.confirm(order, new GatewayCommand(scenario, clientMinor, paymentKey, null, 0), context(provider));
        } catch (PaymentGatewayException ex) {
            catalog.insertError(order.getOrderNo(), provider.id(), ex.getMessage(), ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        return applyOutcome(order, result);
    }

    @Transactional
    public Map<String, Object> cancel(UUID userId, String orderNo) {
        PaymentOrder order = lockOwned(userId, orderNo);
        if (order.getStatus() == PaymentOrderStatus.CANCELLED) {
            return orderView(order);
        }
        if (order.getStatus() != PaymentOrderStatus.READY && order.getStatus() != PaymentOrderStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ORDER_NOT_CANCELLABLE");
        }
        order.setStatus(PaymentOrderStatus.CANCELLED);
        order.setFailReason("USER_CANCEL");
        order.setUpdatedAt(Instant.now());
        orders.save(order);
        return orderView(order);
    }

    @Transactional
    public Map<String, Object> refund(UUID actorId, String orderNo, long refundMinor, String idempotencyKey, boolean superAdmin) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED");
        }
        PaymentOrder order = orders.findByOrderNoForUpdate(orderNo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        if (!superAdmin && !order.getUserId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ORDER_FORBIDDEN");
        }
        if (catalog.refundExists(order.getId(), idempotencyKey.trim())) {
            return orderView(order);
        }
        if (order.getStatus() != PaymentOrderStatus.PAID && order.getStatus() != PaymentOrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ORDER_NOT_REFUNDABLE");
        }
        if ("LIVE".equals(order.getEnvironment()) || !guard.liveExecutionAllowed() && "LIVE".equals(order.getEnvironment())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LIVE_EXECUTION_DISABLED");
        }
        long issued = order.getCreditsIssued() == null ? order.getCredits() + order.getBonusCredits() : order.getCreditsIssued();
        long remainingMinor = order.getChargeAmountMinor() - order.getRefundedMinor();
        if (refundMinor < 1 || refundMinor > remainingMinor) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REFUND_AMOUNT_INVALID");
        }
        long remainingCredits = issued - order.getRefundedCredits();
        long refundCredits;
        try {
            refundCredits = MoneyMinor.creditsForRefund(order.getChargeAmountMinor(), issued, refundMinor);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        if (refundCredits < 1 || refundCredits > remainingCredits) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "REFUND_CREDITS_INVALID");
        }
        ProviderRow provider = requireProvider(order.getProviderConfigId());
        PaymentGateway gateway = registry.require(provider.adapterCode());
        GatewayRefund gatewayRefund = gateway.refund(
                order, new GatewayCommand(null, null, null, idempotencyKey, refundMinor), context(provider));
        if (!gatewayRefund.accepted()) {
            catalog.insertError(order.getOrderNo(), provider.id(), "REFUND_REJECTED", "REFUND_REJECTED");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "REFUND_REJECTED");
        }
        String ref = order.getOrderNo() + "#refund#" + idempotencyKey.trim();
        credits.refundLinkedCredits(order.getUserId(), refundCredits, ref, "env=" + order.getEnvironment());
        catalog.insertRefund(order.getId(), idempotencyKey.trim(), refundMinor, refundCredits);
        order.setRefundedMinor(order.getRefundedMinor() + refundMinor);
        order.setRefundedCredits(order.getRefundedCredits() + refundCredits);
        if (order.getRefundedMinor() == order.getChargeAmountMinor()) {
            order.setStatus(PaymentOrderStatus.CANCELLED);
            order.setFailReason("REFUNDED");
        }
        order.setUpdatedAt(Instant.now());
        orders.save(order);
        if (superAdmin) {
            Map<String, Object> after = new LinkedHashMap<>();
            after.put("refund", true);
            after.put("amountMinor", refundMinor);
            after.put("credits", refundCredits);
            after.put("environment", order.getEnvironment() == null ? "" : order.getEnvironment());
            after.put("idempotencyKey", idempotencyKey.trim());
            audit(order.getOrderNo(), after);
        }
        return orderView(order);
    }

    @Transactional
    public Map<String, Object> receiveWebhook(String providerId, String rawBody, String signature) {
        ProviderRow provider = requireProvider(providerId);
        if ("MOCK".equals(provider.environment()) && !guard.mockAllowed()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MOCK_DISABLED");
        }
        if ("LIVE".equals(provider.environment())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LIVE_EXECUTION_DISABLED");
        }
        PaymentGateway gateway = registry.require(provider.adapterCode());
        GatewayWebhook webhook = gateway.verifyWebhook(rawBody, signature, context(provider));
        String hash = sha256(rawBody);
        if (!webhook.signatureValid() || webhook.eventId() == null) {
            catalog.insertWebhook(UUID.randomUUID(), provider.id(), provider.environment(),
                    webhook.eventId() == null ? "invalid-" + UUID.randomUUID() : webhook.eventId(),
                    webhook.orderNo(), false, false, hash, "REJECTED");
            catalog.insertError(webhook.orderNo(), provider.id(), "WEBHOOK_SIGNATURE_INVALID", "WEBHOOK_SIGNATURE_INVALID");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WEBHOOK_SIGNATURE_INVALID");
        }
        if (catalog.webhookExists(provider.id(), webhook.eventId())) {
            catalog.insertWebhook(UUID.randomUUID(), provider.id(), provider.environment(),
                    webhook.eventId() + ":dup:" + UUID.randomUUID(), webhook.orderNo(), true, true, hash, "DUPLICATE");
            return Map.of("status", "DUPLICATE", "eventId", webhook.eventId());
        }
        catalog.insertWebhook(UUID.randomUUID(), provider.id(), provider.environment(),
                webhook.eventId(), webhook.orderNo(), true, false, hash, webhook.outcome().name());
        if (webhook.orderNo() == null) {
            return Map.of("status", "IGNORED");
        }
        PaymentOrder order = orders.findByOrderNoForUpdate(webhook.orderNo()).orElse(null);
        if (order == null) {
            return Map.of("status", "ORDER_NOT_FOUND");
        }
        if (order.getStatus() == PaymentOrderStatus.PAID) {
            return Map.of("status", "ALREADY_PAID");
        }
        applyOutcome(order, new GatewayConfirm(webhook.outcome(), "WH-" + webhook.eventId(), null));
        return Map.of("status", order.getStatus().name(), "eventId", webhook.eventId());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> myOrders(UUID userId) {
        return orders.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::orderView).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> myOrder(UUID userId, String orderNo) {
        return orderView(lockRead(userId, orderNo));
    }

    @Transactional
    public Map<String, Object> updateProvider(String id, String environment, String contractStatus, Boolean enabled) {
        SuperAdminAuthHelper.requireSuperAdmin();
        ProviderRow current = requireProvider(id);
        if (!current.implemented() && Boolean.TRUE.equals(enabled)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADAPTER_NOT_IMPLEMENTED");
        }
        if ("TOSS_INTERNATIONAL".equals(id) && ("LIVE_READY".equals(contractStatus) || "LIVE".equals(environment) || "TEST_READY".equals(contractStatus))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "APPROVAL_PENDING");
        }
        if ("LIVE".equals(environment) || "LIVE_READY".equals(contractStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LIVE_EXECUTION_DISABLED");
        }
        String nextEnv = environment == null ? current.environment() : environment.trim().toUpperCase(Locale.ROOT);
        String nextStatus = contractStatus == null ? current.contractStatus() : contractStatus.trim().toUpperCase(Locale.ROOT);
        boolean nextEnabled = enabled == null ? current.enabled() : enabled;
        if (nextEnabled && ("NOT_CONFIGURED".equals(nextStatus) || "APPROVAL_PENDING".equals(nextStatus) || "DISABLED".equals(nextStatus))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PROVIDER_NOT_OPERABLE");
        }
        catalog.updateProvider(id, nextEnv, nextStatus, nextEnabled, SecurityUtils.getCurrentUserId());
        audit(id, Map.of("environment", nextEnv, "contractStatus", nextStatus, "enabled", nextEnabled));
        return providerView(requireProvider(id));
    }

    @Transactional
    public Map<String, Object> rotateSecret(
            String providerId, String environment, String clientKey, String clientId, String secret, String merchantId, String webhookSecret) {
        SuperAdminAuthHelper.requireSuperAdmin();
        ProviderRow provider = requireProvider(providerId);
        String env = environment == null ? "" : environment.trim().toUpperCase(Locale.ROOT);
        if (!"TEST".equals(env) && !"LIVE".equals(env)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SECRET_ENVIRONMENT_INVALID");
        }
        if ("LIVE".equals(env) && "TOSS_INTERNATIONAL".equals(providerId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "APPROVAL_PENDING");
        }
        catalog.saveSecret(
                provider.id(),
                env,
                clientKey,
                clientId,
                secret == null || secret.isBlank() ? null : crypto.encrypt(secret.trim()),
                merchantId,
                webhookSecret == null || webhookSecret.isBlank() ? null : crypto.encrypt(webhookSecret.trim()));
        audit(providerId, Map.of("secretEnvironment", env, "rotated", true));
        return credentialView(provider.id(), env);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> credentialView(String providerId, String environment) {
        SuperAdminAuthHelper.requireSuperAdmin();
        SecretRow row = catalog.secret(providerId, environment).orElse(null);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("providerId", providerId);
        body.put("environment", environment);
        body.put("configured", row != null);
        if (row != null) {
            body.put("clientKey", row.clientKey());
            body.put("clientId", row.clientId());
            body.put("merchantId", row.merchantId());
            body.put("secretLast4", last4(decryptQuiet(row.secretCipher())));
            body.put("webhookLast4", last4(decryptQuiet(row.webhookSecretCipher())));
            body.put("updatedAt", row.updatedAt().toString());
        }
        return body;
    }

    @Transactional
    public Map<String, Object> testConnection(String providerId) {
        SuperAdminAuthHelper.requireSuperAdmin();
        ProviderRow provider = requireProvider(providerId);
        if (!provider.implemented()) {
            catalog.markConnection(providerId, "NOT_CHECKED", "NOT_CONFIGURED");
            return Map.of("providerId", providerId, "result", "NOT_IMPLEMENTED");
        }
        if ("MOCK".equals(provider.adapterCode())) {
            if (!guard.mockAllowed()) {
                catalog.markConnection(providerId, "NOT_CHECKED", "DISABLED");
                return Map.of("providerId", providerId, "result", "MOCK_DISABLED");
            }
            ensureMockWebhookSecret(provider);
            catalog.markConnection(providerId, "CONNECTED", "TEST_READY");
            return Map.of("providerId", providerId, "result", "CONNECTED");
        }
        SecretRow secret = catalog.secret(provider.id(), "TEST").orElse(null);
        String plain = secret == null ? null : decryptQuiet(secret.secretCipher());
        String client = secret == null ? null : secret.clientId();
        if ("TOSS".equals(provider.adapterCode())) {
            if (plain == null || plain.isBlank() || secret.clientKey() == null || secret.clientKey().isBlank()) {
                catalog.markConnection(providerId, "NOT_CHECKED", provider.contractStatus());
                return Map.of("providerId", providerId, "result", "NOT_CONFIGURED");
            }
            TossPaymentsClient.ConnectionProbe probe = tossPaymentsClient.probeSecret(plain);
            if (!probe.isValidKey()) {
                catalog.markConnection(providerId, "NOT_CHECKED", "TEST_FAILED");
                return Map.of("providerId", providerId, "result", "TEST_FAILED");
            }
            String status = "TOSS_INTERNATIONAL".equals(providerId) ? "APPROVAL_PENDING" : "TEST_READY";
            catalog.markConnection(providerId, "CONNECTED", status);
            return Map.of("providerId", providerId, "result", "CONNECTED");
        }
        if (plain == null || plain.isBlank() || client == null || client.isBlank()) {
            catalog.markConnection(providerId, "NOT_CHECKED", provider.contractStatus());
            return Map.of("providerId", providerId, "result", "NOT_CONFIGURED");
        }
        catalog.markConnection(providerId, "NOT_CHECKED", provider.contractStatus());
        return Map.of("providerId", providerId, "result", "STORED_NOT_PROBED");
    }

    @Transactional
    public Map<String, Object> addFx(String chargeCurrency, BigDecimal rate, String basis, String rounding, Instant effectiveFrom) {
        SuperAdminAuthHelper.requireSuperAdmin();
        String currency = chargeCurrency.trim().toUpperCase(Locale.ROOT);
        MoneyMinor.scale(currency);
        if (rate == null || rate.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RATE_INVALID");
        }
        UUID id = UUID.randomUUID();
        catalog.insertFx(id, currency, rate, basis == null ? "SA_RATE" : basis.trim(), rounding == null ? "HALF_UP" : rounding, effectiveFrom, SecurityUtils.getCurrentUserId());
        audit("FX", Map.of("chargeCurrency", currency, "rate", rate.toPlainString(), "effectiveFrom", effectiveFrom.toString()));
        return Map.of("id", id.toString(), "chargeCurrency", currency, "rate", rate.toPlainString());
    }

    @Transactional(readOnly = true)
    public List<FxRow> fxHistory(String currency) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.fxHistory(currency.trim().toUpperCase(Locale.ROOT));
    }

    @Transactional(readOnly = true)
    public List<PaymentCatalogStore.WebhookLogRow> webhooks() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.recentWebhooks();
    }

    @Transactional(readOnly = true)
    public List<PaymentCatalogStore.ErrorLogRow> errors() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.recentErrors();
    }

    @Transactional
    public void setMethodEnabled(UUID methodId, boolean enabled) {
        SuperAdminAuthHelper.requireSuperAdmin();
        catalog.setMethodEnabled(methodId, enabled);
        audit(methodId.toString(), Map.of("methodEnabled", enabled));
    }

    @Transactional(readOnly = true)
    public List<PaymentCatalogStore.OrderAdminRow> searchOrders(
            String query, String environment, String status, Instant from, Instant to) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.searchOrders(query, environment, status, from, to);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> orderDetail(String orderNo) {
        SuperAdminAuthHelper.requireSuperAdmin();
        PaymentCatalogStore.OrderAdminRow order = catalog.orderByNo(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("order", order);
        body.put("ledger", catalog.ledgerLines(order.userId(), order.orderNo()));
        long refundable = order.chargeAmountMinor() == null ? 0 : Math.max(0, order.chargeAmountMinor() - order.refundedMinor());
        body.put("refundableMinor", refundable);
        body.put("liveRefundAllowed", false);
        return body;
    }

    @Transactional(readOnly = true)
    public List<PaymentCatalogStore.RefundAdminRow> refunds() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.refunds();
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Map<String, Object> reprocessError(UUID errorId, String scenario) {
        SuperAdminAuthHelper.requireSuperAdmin();
        PaymentCatalogStore.ErrorLogRow error = catalog.error(errorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ERROR_NOT_FOUND"));
        if (!error.retryable()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "NOT_RETRYABLE");
        }
        PaymentOrder order = orders.findByOrderNo(error.orderNo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        if ("LIVE".equals(order.getEnvironment())) {
            catalog.markError(errorId, "BLOCKED");
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LIVE_EXECUTION_DISABLED");
        }
        if (!"MOCK".equals(order.getEnvironment())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "REPROCESS_REQUIRES_MOCK_OR_PROVIDER");
        }
        if (order.getStatus() != PaymentOrderStatus.READY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ORDER_NOT_READY");
        }
        if (scenario == null || scenario.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SCENARIO_REQUIRED");
        }
        Map<String, Object> result = confirm(order.getUserId(), order.getOrderNo(), scenario, order.getChargeAmountMinor(), null);
        catalog.markError(errorId, "REPROCESSED");
        audit(errorId.toString(), Map.of("reprocess", scenario, "orderNo", order.getOrderNo(), "environment", order.getEnvironment()));
        return result;
    }

    @Transactional
    public Map<String, Object> runAdminMockTest(String email, UUID packageId, String paymentCountry, String scenario) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (!guard.mockAllowed()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MOCK_DISABLED");
        }
        PaymentCatalogStore.UserRef user = catalog.userByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        String chosen = scenario == null || scenario.isBlank() ? "SUCCESS" : scenario.trim().toUpperCase(Locale.ROOT);
        Map<String, Object> created = createOrder(
                user.id(), packageId, paymentCountry, "MOCK", "MOCK_CARD", "admin-mock-" + UUID.randomUUID());
        String orderNo = String.valueOf(created.get("orderNo"));
        long minor = ((Number) created.get("chargeAmountMinor")).longValue();
        Map<String, Object> result;
        try {
            result = "CANCEL".equals(chosen)
                    ? cancel(user.id(), orderNo)
                    : confirm(user.id(), orderNo, chosen, minor, null);
        } catch (ResponseStatusException ex) {
            if (ex.getStatusCode().value() != HttpStatus.BAD_GATEWAY.value()) {
                throw ex;
            }
            result = new LinkedHashMap<>();
            result.put("orderNo", orderNo);
            result.put("status", catalog.orderByNo(orderNo).map(PaymentCatalogStore.OrderAdminRow::status).orElse("READY"));
            result.put("error", ex.getReason() == null ? "BAD_GATEWAY" : ex.getReason());
        }
        entityManager.flush();
        Map<String, Object> body = new LinkedHashMap<>(result);
        body.put("walletBalance", credits.getBalance(user.id()));
        body.put("ledgerClosing", catalog.ledgerClosing(user.id()));
        body.put("chargeCount", catalog.chargeCount(user.id(), orderNo));
        audit(orderNo, Map.of("mockTest", chosen, "email", user.email(), "environment", "MOCK"));
        return body;
    }

    @Transactional(readOnly = true)
    public PaymentCatalogStore.UserRef testUser(String email) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.userByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> paymentAdminHistory() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.recentPaymentAudits();
    }

    @Transactional(readOnly = true)
    public List<MethodRow> allMethods() {
        SuperAdminAuthHelper.requireSuperAdmin();
        return catalog.methods();
    }

    public String mockWebhookSecretForTest(String providerId) {
        SecretRow row = catalog.secret(providerId, "TEST")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "WEBHOOK_SECRET_MISSING"));
        String secret = decryptQuiet(row.webhookSecretCipher());
        if (secret == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "WEBHOOK_SECRET_MISSING");
        }
        return secret;
    }

    private Map<String, Object> applyOutcome(PaymentOrder order, GatewayConfirm result) {
        Instant now = Instant.now();
        if (result.outcome() == Outcome.PAID) {
            order.setStatus(PaymentOrderStatus.PAID);
            order.setPaidAt(now);
            order.setProviderTxId(result.providerTxId());
            order.setPaymentKey(result.providerTxId());
            order.setUpdatedAt(now);
            orders.save(order);
            credits.applyChargeFromPaymentOrder(order);
            return orderView(order);
        }
        if (result.outcome() == Outcome.RETRYABLE || result.outcome() == Outcome.PENDING) {
            catalog.insertError(order.getOrderNo(), order.getProviderConfigId(), result.reason(), result.reason());
            order.setFailReason(result.reason());
            order.setUpdatedAt(now);
            orders.save(order);
            if (result.outcome() == Outcome.RETRYABLE) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, result.reason());
            }
            return orderView(order);
        }
        order.setStatus(result.outcome() == Outcome.CANCELLED ? PaymentOrderStatus.CANCELLED : PaymentOrderStatus.FAILED);
        order.setFailReason(result.reason());
        order.setUpdatedAt(now);
        orders.save(order);
        catalog.insertError(order.getOrderNo(), order.getProviderConfigId(), result.reason(), result.reason());
        return orderView(order);
    }

    private void assertExecutable(ProviderRow provider) {
        if (!provider.implemented()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ADAPTER_NOT_IMPLEMENTED");
        }
        if ("APPROVAL_PENDING".equals(provider.contractStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "APPROVAL_PENDING");
        }
        if ("LIVE".equals(provider.environment()) || !guard.liveExecutionAllowed() && "LIVE".equals(provider.environment())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "LIVE_EXECUTION_DISABLED");
        }
        if ("MOCK".equals(provider.environment()) && !guard.mockAllowed()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "MOCK_DISABLED");
        }
    }

    private boolean offerAvailable(MethodRow row) {
        return PaymentMethodGate.available(new PaymentMethodGate.MethodOffer(
                row.providerId(), row.environment(), row.contractStatus(), row.connectionStatus(),
                row.providerEnabled(), row.implemented(), row.providerCountries(), row.providerCurrencies(),
                row.providerMethods(), row.paymentCountry(), row.merchantCountry(), row.methodCode(),
                row.currency(), row.enabled()), guard.mockAllowed(), guard.liveExecutionAllowed());
    }

    private MethodRow requireAvailableMethod(String paymentCountry, String providerId, String methodCode) {
        String country = iso2(paymentCountry);
        return catalog.methods().stream()
                .filter(row -> country.equals(row.paymentCountry()))
                .filter(row -> row.providerId().equals(providerId))
                .filter(row -> row.methodCode().equals(methodCode))
                .filter(this::offerAvailable)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAYMENT_METHOD_UNAVAILABLE"));
    }

    private FxQuote quoteFx(String currency, long credits, Instant at) {
        if ("USD".equals(currency)) {
            return new FxQuote(null, BigDecimal.ONE, MoneyMinor.chargeMinor(credits, BigDecimal.ONE, "USD", "HALF_UP"));
        }
        FxRow row = catalog.fxAt(currency, at)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "FX_NOT_CONFIGURED"));
        long minor = MoneyMinor.chargeMinor(credits, row.rate(), currency, row.roundingMode());
        return new FxQuote(row.id(), row.rate(), minor);
    }

    private CreditPackage activePackage(UUID packageId) {
        CreditPackage pkg = packages.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PACKAGE_NOT_FOUND"));
        if (!pkg.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PACKAGE_INACTIVE");
        }
        return pkg;
    }

    private static long issuedCredits(CreditPackage pkg) {
        long issued = pkg.getCredits() + pkg.getBonusCredits();
        if (issued < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CREDITS_INVALID");
        }
        if (pkg.getPrice() == null || pkg.getPrice().stripTrailingZeros().scale() > 0
                || pkg.getPrice().longValueExact() != pkg.getCredits()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "USD_CREDIT_PARITY");
        }
        return issued;
    }

    private PaymentOrder lockOwned(UUID userId, String orderNo) {
        PaymentOrder order = orders.findByOrderNoForUpdate(orderNo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ORDER_FORBIDDEN");
        }
        return order;
    }

    private PaymentOrder lockRead(UUID userId, String orderNo) {
        PaymentOrder order = orders.findByOrderNo(orderNo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND"));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ORDER_FORBIDDEN");
        }
        return order;
    }

    private ProviderRow requireProvider(String id) {
        return catalog.provider(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PROVIDER_NOT_FOUND"));
    }

    private GatewayContext context(ProviderRow provider) {
        String slot = "LIVE".equals(provider.environment()) ? "LIVE" : "TEST";
        SecretRow secret = catalog.secret(provider.id(), slot).orElse(null);
        return new GatewayContext(
                provider.id(),
                provider.environment(),
                secret == null ? null : secret.clientKey(),
                secret == null ? null : secret.clientId(),
                secret == null ? null : decryptQuiet(secret.secretCipher()),
                secret == null ? null : decryptQuiet(secret.webhookSecretCipher()));
    }

    private void ensureMockWebhookSecret(ProviderRow provider) {
        SecretRow existing = catalog.secret(provider.id(), "TEST").orElse(null);
        if (existing != null && existing.webhookSecretCipher() != null) {
            return;
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        catalog.saveSecret(provider.id(), "TEST", null, null, null, null, crypto.encrypt(HexFormat.of().formatHex(bytes)));
    }

    private String decryptQuiet(String cipher) {
        if (cipher == null || cipher.isBlank()) {
            return null;
        }
        return crypto.decrypt(cipher);
    }

    private void audit(String entityId, Map<String, Object> after) {
        UUID admin = SecurityUtils.getCurrentUserId();
        if (admin != null) {
            audit.log(admin, AdminAuditAction.PAYMENT_SETTINGS_PATCH, "PAYMENT_PROVIDER", entityId, Map.of(), after);
        }
    }

    private Map<String, Object> providerView(ProviderRow row) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", row.id());
        body.put("adapterCode", row.adapterCode());
        body.put("name", row.displayName());
        body.put("environment", row.environment());
        body.put("countries", row.countries());
        body.put("currencies", row.currencies());
        body.put("methods", row.methods());
        body.put("contractStatus", row.contractStatus());
        body.put("enabled", row.enabled());
        body.put("implemented", row.implemented());
        body.put("connectionStatus", row.connectionStatus());
        body.put("operable", PaymentMethodGate.available(new PaymentMethodGate.MethodOffer(
                row.id(), row.environment(), row.contractStatus(), row.connectionStatus(), row.enabled(), row.implemented(),
                row.countries(), row.currencies(), row.methods(), first(row.countries()), "KR", first(row.methods()),
                first(row.currencies()), true), guard.mockAllowed(), guard.liveExecutionAllowed()));
        body.put("updatedAt", row.updatedAt().toString());
        return body;
    }

    private Map<String, Object> methodView(MethodRow row) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", row.id().toString());
        body.put("providerId", row.providerId());
        body.put("providerName", row.providerName());
        body.put("methodCode", row.methodCode());
        body.put("paymentCountry", row.paymentCountry());
        body.put("merchantCountry", row.merchantCountry());
        body.put("currency", row.currency());
        body.put("environment", row.environment());
        return body;
    }

    private Map<String, Object> orderView(PaymentOrder order) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderNo", order.getOrderNo());
        body.put("status", order.getStatus().name());
        body.put("providerId", order.getProviderConfigId());
        body.put("provider", order.getProvider());
        body.put("methodCode", order.getMethodCode());
        body.put("environment", order.getEnvironment());
        body.put("paymentCountry", order.getPaymentCountry());
        body.put("credits", order.getCreditsIssued() == null ? order.getCredits() + order.getBonusCredits() : order.getCreditsIssued());
        body.put("chargeCurrency", order.getChargeCurrency());
        body.put("chargeAmountMinor", order.getChargeAmountMinor());
        body.put("scale", order.getChargeCurrency() == null ? null : MoneyMinor.scale(order.getChargeCurrency()));
        body.put("fxRate", order.getFxRate() == null ? null : order.getFxRate().toPlainString());
        body.put("refundedMinor", order.getRefundedMinor());
        body.put("refundedCredits", order.getRefundedCredits());
        body.put("failReason", order.getFailReason());
        body.put("amountUsd", order.getAmount());
        body.put("currency", order.getCurrency());
        if (order.getProviderConfigId() != null && !"LIVE".equals(order.getEnvironment())) {
            catalog.secret(order.getProviderConfigId(), "TEST").ifPresent(secret -> {
                if (secret.clientKey() != null && !secret.clientKey().isBlank()) {
                    body.put("clientKey", secret.clientKey());
                }
            });
        }
        return body;
    }

    private static UUID requireUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }

    private static String iso2(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAYMENT_COUNTRY_REQUIRED");
        }
        String code = raw.trim().toUpperCase(Locale.ROOT);
        if (code.length() != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "PAYMENT_COUNTRY_INVALID");
        }
        return code;
    }

    private static String first(String csv) {
        if (csv == null || csv.isBlank()) {
            return "";
        }
        return csv.split(",")[0].trim();
    }

    private static String last4(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String value = raw.trim();
        return value.length() <= 4 ? "****" : "****" + value.substring(value.length() - 4);
    }

    private static String sha256(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((raw == null ? "" : raw).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            return "";
        }
    }

    private record FxQuote(UUID rateId, BigDecimal rate, long minor) {
    }
}
