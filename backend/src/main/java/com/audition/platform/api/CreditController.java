package com.audition.platform.api;

import com.audition.platform.api.dto.CreditBalanceResponse;
import com.audition.platform.api.dto.CreditChargeRequest;
import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.api.dto.CreditPolicyPublicDto;
import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.api.dto.PreparePaymentRequest;
import com.audition.platform.api.dto.PreparePaymentResponse;
import com.audition.platform.application.credit.CreditPolicyKey;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditService creditService;
    private final PaymentOrderService paymentOrderService;
    private final boolean allowLegacySelfChargeApi;

    public CreditController(
            CreditService creditService,
            PaymentOrderService paymentOrderService,
            @Value("${app.credits.allow-legacy-self-charge:true}") boolean allowLegacySelfChargeApi) {
        this.creditService = creditService;
        this.paymentOrderService = paymentOrderService;
        this.allowLegacySelfChargeApi = allowLegacySelfChargeApi;
    }

    /**
     * 비로그인 공개: 오디션 지원 1회 비용·정책 활성 여부만 노출 ({@link CreditPolicyKey#AUDITION_APPLY} 만 허용).
     */
    @GetMapping("/public/policies/{policyKey}")
    public CreditPolicyPublicDto getPublicPolicy(@PathVariable String policyKey) {
        String key = policyKey != null ? policyKey.trim() : "";
        if (!CreditPolicyKey.AUDITION_APPLY.equals(key)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공개 정책을 찾을 수 없습니다.");
        }
        return creditService.getPolicyPublicSnapshot(key);
    }

    @GetMapping("/balance")
    public CreditBalanceResponse getBalance() {
        UUID userId = requireUserId();
        return new CreditBalanceResponse(creditService.getBalance(userId));
    }

    @GetMapping("/transactions")
    public Page<CreditTransactionDto> listMyTransactions(
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = requireUserId();
        return creditService.listMyTransactions(userId, type, pageable);
    }

    /**
     * 레거시 수동 충전. 운영에서는 {@code app.credits.allow-legacy-self-charge=false} 로 비활성화하고
     * 결제 주문({@link PaymentOrderService}) 경로만 허용할 것.
     */
    @PostMapping("/charge")
    public CreditBalanceResponse charge(@Valid @RequestBody CreditChargeRequest request) {
        if (!allowLegacySelfChargeApi) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "수동 충전 API는 비활성화되었습니다. 패키지 결제를 이용해 주세요.");
        }
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
