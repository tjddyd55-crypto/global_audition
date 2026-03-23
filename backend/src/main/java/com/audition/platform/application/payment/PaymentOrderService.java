package com.audition.platform.application.payment;

import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.api.dto.PreparePaymentResponse;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
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

    private final PaymentOrderRepository paymentOrderRepository;
    private final CreditPackageRepository creditPackageRepository;
    private final CreditService creditService;
    private final Map<String, PaymentProvider> providersByCode;

    public PaymentOrderService(
            PaymentOrderRepository paymentOrderRepository,
            CreditPackageRepository creditPackageRepository,
            CreditService creditService,
            List<PaymentProvider> providers) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.creditPackageRepository = creditPackageRepository;
        this.creditService = creditService;
        this.providersByCode = providers.stream()
                .collect(Collectors.toMap(p -> p.getCode().toUpperCase(Locale.ROOT), Function.identity(), (a, b) -> a));
    }

    private static String newOrderNo() {
        return "ORD-" + UUID.randomUUID().toString().replace("-", "");
    }

    @Transactional
    public PreparePaymentResponse preparePayment(UUID userId, UUID packageId, String providerCode) {
        String code = (providerCode == null || providerCode.isBlank())
                ? MockPaymentProvider.CODE
                : providerCode.trim().toUpperCase(Locale.ROOT);
        PaymentProvider provider = providersByCode.get(code);
        if (provider == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 결제 provider입니다.");
        }
        CreditPackage pkg = creditPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "패키지를 찾을 수 없습니다."));
        if (!pkg.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 중이 아닌 패키지입니다.");
        }
        Instant now = Instant.now();
        PaymentOrder order = new PaymentOrder();
        order.setOrderNo(newOrderNo());
        order.setUserId(userId);
        order.setPackageId(packageId);
        order.setProvider(code);
        order.setAmount(pkg.getPrice());
        order.setCurrency("KRW");
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
        r.setCredits(order.getCredits());
        r.setBonusCredits(order.getBonusCredits());
        r.setCurrency(order.getCurrency());
        r.setStatus(order.getStatus().name());
        r.setProvider(code);
        r.setRedirectUrl(prep.getRedirectUrl());
        r.setMessage("결제 단계로 이동합니다. (PG 연동 전에는 목 결제 페이지를 사용합니다.)");
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

    @Transactional
    public void handleSuccessCallback(String orderNo, String providerTxId, JsonNode payload, UUID currentUserId) {
        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."));
        if (!order.getUserId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "주문에 접근할 수 없습니다.");
        }
        // 멱등: 이미 PAID면 크레딧 재지급·PG 콜백 부작용 방지 (FOR UPDATE 로 동시 콜백 직렬화)
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
}
