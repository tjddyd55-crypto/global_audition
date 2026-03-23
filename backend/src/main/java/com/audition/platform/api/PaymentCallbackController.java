package com.audition.platform.api;

import com.audition.platform.api.dto.PaymentFailureCallbackRequest;
import com.audition.platform.api.dto.PaymentSuccessCallbackRequest;
import com.audition.platform.application.payment.PaymentOrderService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * PG 웹훅 전 단계: 로그인 사용자가 자신의 주문에 대해서만 콜백 가능(mock 테스트용).
 * 실제 PG 연동 시 서버 간 검증·서명 후 동일 {@link PaymentOrderService} 호출로 교체.
 */
@RestController
@RequestMapping("/api/payments/callback")
public class PaymentCallbackController {

    private final PaymentOrderService paymentOrderService;

    public PaymentCallbackController(PaymentOrderService paymentOrderService) {
        this.paymentOrderService = paymentOrderService;
    }

    @PostMapping("/success")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void success(@Valid @RequestBody PaymentSuccessCallbackRequest body) {
        UUID userId = requireUserId();
        paymentOrderService.handleSuccessCallback(
                body.getOrderNo().trim(),
                body.getProviderTxId() != null ? body.getProviderTxId().trim() : null,
                body.getPayload(),
                userId);
    }

    @PostMapping("/fail")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void fail(@Valid @RequestBody PaymentFailureCallbackRequest body) {
        UUID userId = requireUserId();
        paymentOrderService.handleFailureCallback(
                body.getOrderNo().trim(),
                body.getReason(),
                body.getPayload(),
                userId);
    }

    private static UUID requireUserId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
