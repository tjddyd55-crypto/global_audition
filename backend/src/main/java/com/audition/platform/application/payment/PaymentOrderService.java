package com.audition.platform.application.payment;

import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.api.dto.PreparePaymentResponse;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import com.audition.platform.domain.payment.PlatformPaymentSettings;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 패키지 결제 주문 라이프사이클. 크레딧 잔액 증가(충전)는 {@link CreditService#applyChargeFromPaymentOrder} 만 사용하며,
 * {@code credit_transactions.referenceId} 에 {@link PaymentOrder#getOrderNo()} 를 넣어 추적한다.
 */
@Service
public class PaymentOrderService {

    public static final String NATIVE_SUCCESS_URL = "globalaudition://payments/success";
    public static final String NATIVE_FAIL_URL = "globalaudition://payments/fail";

    private final PaymentOrderRepository paymentOrderRepository;
    private final CreditPackageRepository creditPackageRepository;
    private final CreditService creditService;
    private final PaymentSettingsService paymentSettingsService;
    private final TossPaymentsClient tossPaymentsClient;
    private final Map<String, PaymentProvider> providersByCode;

    public PaymentOrderService(
            PaymentOrderRepository paymentOrderRepository,
            CreditPackageRepository creditPackageRepository,
            CreditService creditService,
            PaymentSettingsService paymentSettingsService,
            TossPaymentsClient tossPaymentsClient,
            List<PaymentProvider> providers) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.creditPackageRepository = creditPackageRepository;
        this.creditService = creditService;
        this.paymentSettingsService = paymentSettingsService;
        this.tossPaymentsClient = tossPaymentsClient;
        Map<String, PaymentProvider> map = providers.stream()
                .collect(Collectors.toMap(p -> p.getCode().toUpperCase(Locale.ROOT), Function.identity(), (a, b) -> a));
        PaymentProvider toss = map.get(TossPaymentProvider.CODE);
        if (toss != null) {
            map.put(TossPaymentProvider.LEGACY_CODE, toss);
        }
        this.providersByCode = map;
    }

    private static String newOrderNo() {
        return "ORD-" + UUID.randomUUID().toString().replace("-", "");
    }

    private static boolean isToss(String code) {
        return TossPaymentProvider.CODE.equals(code) || TossPaymentProvider.LEGACY_CODE.equals(code);
    }

    @Transactional
    public PreparePaymentResponse preparePayment(UUID userId, UUID packageId, String providerCode) {
        String code = (providerCode == null || providerCode.isBlank())
                ? MockPaymentProvider.CODE
                : providerCode.trim().toUpperCase(Locale.ROOT);
        if (TossPaymentProvider.LEGACY_CODE.equals(code)) {
            code = TossPaymentProvider.CODE;
        }
        PaymentProvider provider = providersByCode.get(code);
        if (provider == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 결제 provider입니다.");
        }
        CreditPackage pkg = creditPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        if (!pkg.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 중이 아닌 패키지입니다.");
        }

        String currency = SettlementCurrency.CODE;
        if (isToss(code)) {
            PlatformPaymentSettings settings = paymentSettingsService.current();
            if (!settings.isEnabled()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "토스 결제가 비활성화되어 있습니다.");
            }
            currency = SettlementCurrency.requireUsd(settings.getCurrency());
        }
        BigDecimal amount = SettlementCurrency.requireWholeUsd(pkg.getPrice());

        Instant now = Instant.now();
        PaymentOrder order = new PaymentOrder();
        order.setOrderNo(newOrderNo());
        order.setUserId(userId);
        order.setPackageId(packageId);
        order.setProvider(code);
        order.setAmount(amount);
        order.setCurrency(currency);
        order.setStatus(PaymentOrderStatus.CREATED);
        order.setCredits(pkg.getCredits());
        order.setBonusCredits(pkg.getBonusCredits());
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        paymentOrderRepository.save(order);

        PaymentPrepareResult prep = provider.preparePayment(order);
        order.setStatus(PaymentOrderStatus.READY);
        order.setUpdatedAt(Instant.now());
        paymentOrderRepository.save(order);

        PreparePaymentResponse r = new PreparePaymentResponse();
        r.setOrderNo(order.getOrderNo());
        r.setOrderId(order.getOrderNo());
        r.setPackageId(pkg.getId().toString());
        r.setPackageName(pkg.getName());
        r.setAmount(order.getAmount());
        r.setStripeAmountCents(UsdMoney.toStripeCents(order.getAmount()));
        r.setCredits(order.getCredits());
        r.setBonusCredits(order.getBonusCredits());
        r.setCurrency(order.getCurrency());
        r.setStatus(order.getStatus().name());
        r.setProvider(code);
        r.setRedirectUrl(prep.getRedirectUrl());
        r.setOrderName(pkg.getName());
        if (isToss(code)) {
            r.setClientKey(paymentSettingsService.requireActiveClientKey());
            r.setTossAmount(SettlementCurrency.toTossAmount(order.getAmount(), order.getCurrency()));
            r.setSuccessUrl(NATIVE_SUCCESS_URL);
            r.setFailUrl(NATIVE_FAIL_URL);
            r.setVariantKey(paymentSettingsService.resolvedVariantKey());
            r.setTossMethod(SettlementCurrency.TOSS_METHOD);
            r.setForeignEasyPayProvider(SettlementCurrency.TOSS_EASY_PAY_PROVIDER);
            r.setMessage("토스 결제창으로 이동합니다. 승인 금액은 서버가 패키지에서 확정합니다.");
        } else {
            r.setMessage("결제 단계로 이동합니다. (PG 연동 전에는 목 결제 페이지를 사용합니다.)");
        }
        return r;
    }

    @Transactional(readOnly = true)
    public PreparePaymentResponse checkoutSessionForUser(String orderNo, UUID userId) {
        PaymentOrder order = paymentOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() != PaymentOrderStatus.READY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제할 수 있는 주문이 아닙니다.");
        }
        CreditPackage pkg = creditPackageRepository.findById(order.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "패키지를 찾을 수 없습니다."));
        PreparePaymentResponse r = new PreparePaymentResponse();
        r.setOrderNo(order.getOrderNo());
        r.setOrderId(order.getOrderNo());
        r.setPackageId(pkg.getId().toString());
        r.setPackageName(pkg.getName());
        r.setAmount(order.getAmount());
        r.setStripeAmountCents(UsdMoney.toStripeCents(order.getAmount()));
        r.setCredits(order.getCredits());
        r.setBonusCredits(order.getBonusCredits());
        r.setCurrency(order.getCurrency());
        r.setStatus(order.getStatus().name());
        r.setProvider(order.getProvider());
        r.setOrderName(pkg.getName());
        if (isToss(order.getProvider())) {
            r.setClientKey(paymentSettingsService.requireActiveClientKey());
            r.setTossAmount(SettlementCurrency.toTossAmount(order.getAmount(), order.getCurrency()));
            r.setSuccessUrl(NATIVE_SUCCESS_URL);
            r.setFailUrl(NATIVE_FAIL_URL);
            r.setRedirectUrl("/credits/toss-checkout?orderNo=" + order.getOrderNo());
            r.setVariantKey(paymentSettingsService.resolvedVariantKey());
            r.setTossMethod(SettlementCurrency.TOSS_METHOD);
            r.setForeignEasyPayProvider(SettlementCurrency.TOSS_EASY_PAY_PROVIDER);
        }
        return r;
    }

    @Transactional(readOnly = true)
    public CreditOrderSummaryResponse getOrderForUser(String orderNo, UUID userId) {
        PaymentOrder o = paymentOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!o.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        CreditPackage pkg = creditPackageRepository.findById(o.getPackageId()).orElse(null);
        return toSummary(o, pkg);
    }

    /**
     * 토스 승인. 클라이언트 amount 는 조회만 하고, 실제 confirm 금액은 서버 주문 금액을 쓴다.
     */
    @Transactional(noRollbackFor = org.springframework.web.server.ResponseStatusException.class)
    public CreditOrderSummaryResponse confirmToss(UUID userId, String paymentKey, String orderId, long clientAmount) {
        String key = paymentKey.trim();
        String orderNo = orderId.trim();

        PaymentOrder byKey = paymentOrderRepository.findByPaymentKey(key).orElse(null);
        if (byKey != null && !byKey.getOrderNo().equals(orderNo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 다른 주문에 사용된 paymentKey입니다.");
        }

        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        if (!isToss(order.getProvider())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "토스 주문이 아닙니다.");
        }

        long serverAmount = SettlementCurrency.toTossAmount(order.getAmount(), order.getCurrency());
        if (clientAmount != serverAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 금액이 주문과 일치하지 않습니다.");
        }

        if (order.getStatus() == PaymentOrderStatus.PAID) {
            if (key.equals(order.getPaymentKey())) {
                CreditPackage paidPkg = creditPackageRepository.findById(order.getPackageId()).orElse(null);
                return toSummary(order, paidPkg);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 다른 paymentKey로 승인된 주문입니다.");
        }
        if (order.getStatus() == PaymentOrderStatus.FAILED || order.getStatus() == PaymentOrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제를 완료할 수 없는 주문 상태입니다.");
        }
        if (order.getStatus() != PaymentOrderStatus.READY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제를 완료할 수 있는 상태가 아닙니다. (READY만 허용)");
        }

        CreditPackage pkg = creditPackageRepository.findById(order.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "패키지를 찾을 수 없습니다."));
        if (!pkg.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 중이 아닌 패키지입니다.");
        }

        JsonNode tossPayload;
        try {
            tossPayload = tossPaymentsClient.confirm(
                    paymentSettingsService.requireActiveSecret(),
                    key,
                    order.getOrderNo(),
                    serverAmount);
        } catch (TossPaymentsException e) {
            order.setStatus(PaymentOrderStatus.FAILED);
            order.setFailReason(safeFailReason(e.getMessage()));
            order.setUpdatedAt(Instant.now());
            paymentOrderRepository.save(order);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        Instant now = Instant.now();
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(now);
        order.setPaymentKey(key);
        order.setProviderTxId(key);
        order.setRawPayload(tossPayload);
        order.setUpdatedAt(now);
        paymentOrderRepository.save(order);
        creditService.applyChargeFromPaymentOrder(order);
        return toSummary(order, pkg);
    }

    /**
     * 토스 취소. 지급 크레딧이 이미 소비되면 음수 잔액 정책을 만들지 않고 409.
     */
    @Transactional
    public CreditOrderSummaryResponse cancelToss(UUID actorId, String orderNo, String reason, boolean superAdmin) {
        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!superAdmin && !order.getUserId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        if (order.getStatus() == PaymentOrderStatus.CANCELLED) {
            CreditPackage pkg = creditPackageRepository.findById(order.getPackageId()).orElse(null);
            return toSummary(order, pkg);
        }
        if (order.getStatus() != PaymentOrderStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 완료 주문만 취소할 수 있습니다.");
        }
        if (order.getPaidAt() != null && creditService.hasSpentCreditsSince(order.getUserId(), order.getPaidAt())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "지급된 크레딧이 이미 사용되어 환불할 수 없습니다. 음수 잔액 정책은 도입하지 않습니다.");
        }
        if (isToss(order.getProvider()) && order.getPaymentKey() != null) {
            try {
                tossPaymentsClient.cancel(
                        paymentSettingsService.requireActiveSecret(),
                        order.getPaymentKey(),
                        reason);
            } catch (TossPaymentsException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
            }
        }
        creditService.refundChargeFromPaymentOrder(order, reason);
        order.setStatus(PaymentOrderStatus.CANCELLED);
        order.setFailReason(safeFailReason(reason));
        order.setUpdatedAt(Instant.now());
        paymentOrderRepository.save(order);
        CreditPackage pkg = creditPackageRepository.findById(order.getPackageId()).orElse(null);
        return toSummary(order, pkg);
    }

    @Transactional
    public void handleSuccessCallback(String orderNo, String providerTxId, JsonNode payload, UUID currentUserId) {
        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        if (isToss(order.getProvider())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "토스 주문은 /api/payments/toss/confirm 을 사용하세요.");
        }
        if (order.getStatus() == PaymentOrderStatus.PAID) {
            return;
        }
        if (order.getStatus() == PaymentOrderStatus.FAILED || order.getStatus() == PaymentOrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제를 완료할 수 없는 주문 상태입니다.");
        }
        if (order.getStatus() != PaymentOrderStatus.READY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제를 완료할 수 있는 상태가 아닙니다. (READY만 허용)");
        }

        PaymentProvider provider = providersByCode.get(order.getProvider().toUpperCase(Locale.ROOT));
        if (provider != null) {
            provider.handleSuccessCallback(payload);
        }

        Instant now = Instant.now();
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(now);
        order.setProviderTxId(providerTxId);
        order.setRawPayload(payload);
        order.setUpdatedAt(now);
        paymentOrderRepository.save(order);

        creditService.applyChargeFromPaymentOrder(order);
    }

    @Transactional
    public void handleFailureCallback(String orderNo, String reason, JsonNode payload, UUID currentUserId) {
        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        PaymentProvider provider = providersByCode.get(order.getProvider().toUpperCase(Locale.ROOT));
        if (provider != null) {
            provider.handleFailureCallback(payload);
        }
        if (order.getStatus() == PaymentOrderStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미 결제 완료된 주문입니다.");
        }
        if (order.getStatus() == PaymentOrderStatus.FAILED) {
            return;
        }
        if (order.getStatus() == PaymentOrderStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "취소된 주문입니다.");
        }
        if (order.getStatus() != PaymentOrderStatus.READY && order.getStatus() != PaymentOrderStatus.CREATED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "실패 처리할 수 있는 상태가 아닙니다.");
        }
        order.setStatus(PaymentOrderStatus.FAILED);
        order.setFailReason(reason != null && !reason.isBlank() ? reason.trim() : "UNKNOWN");
        order.setRawPayload(payload);
        order.setUpdatedAt(Instant.now());
        paymentOrderRepository.save(order);
    }

    /** @deprecated 사용처는 {@link SettlementCurrency#toTossAmount} */
    public static long toTossAmount(BigDecimal amount, String currency) {
        return SettlementCurrency.toTossAmount(amount, currency);
    }

    private static String safeFailReason(String raw) {
        if (raw == null || raw.isBlank()) {
            return "UNKNOWN";
        }
        String trimmed = raw.trim();
        return trimmed.length() > 400 ? trimmed.substring(0, 400) : trimmed;
    }

    private static CreditOrderSummaryResponse toSummary(PaymentOrder o, CreditPackage pkg) {
        CreditOrderSummaryResponse r = new CreditOrderSummaryResponse();
        r.setOrderNo(o.getOrderNo());
        r.setStatus(o.getStatus().name());
        r.setProvider(o.getProvider());
        r.setAmount(o.getAmount());
        r.setCurrency(o.getCurrency());
        r.setCredits(o.getCredits());
        r.setBonusCredits(o.getBonusCredits());
        r.setPackageId(o.getPackageId().toString());
        r.setPackageName(pkg != null ? pkg.getName() : "(삭제된 패키지)");
        r.setPaidAt(o.getPaidAt());
        r.setFailReason(o.getFailReason());
        r.setCreatedAt(o.getCreatedAt());
        return r;
    }

    public Map<String, Object> publicCheckoutHints() {
        PlatformPaymentSettings settings = paymentSettingsService.current();
        Map<String, Object> out = new HashMap<>();
        out.put("enabled", settings.isEnabled());
        out.put("environment", settings.getEnvironment());
        out.put("currency", SettlementCurrency.requireUsd(settings.getCurrency()));
        out.put("foreignCurrencyEnabled", false);
        out.put("tossMethod", SettlementCurrency.TOSS_METHOD);
        out.put("foreignEasyPayProvider", SettlementCurrency.TOSS_EASY_PAY_PROVIDER);
        out.put("variantKey", paymentSettingsService.resolvedVariantKey());
        out.put("midConfigured", paymentSettingsService.resolvedMid() != null);
        out.put("successScheme", NATIVE_SUCCESS_URL);
        out.put("failScheme", NATIVE_FAIL_URL);
        return out;
    }
}
