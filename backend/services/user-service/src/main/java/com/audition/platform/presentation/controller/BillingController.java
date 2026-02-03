package com.audition.platform.presentation.controller;

import com.audition.platform.application.dto.CreateCustomerRequest;
import com.audition.platform.application.dto.CreateSubscriptionRequest;
import com.audition.platform.application.service.BillingService;
import com.audition.platform.domain.entity.StripeWebhookEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 결제 컨트롤러
 * 작업: 2026_08_stripe_payment
 */
@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Stripe 결제 API")
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/webhook")
    @Operation(summary = "Stripe 웹훅 수신", description = "Stripe에서 전송하는 이벤트를 수신하고 저장합니다")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signature
    ) {
        StripeWebhookEvent event = billingService.saveWebhookEvent(payload, signature);
        return ResponseEntity.ok(Map.of(
                "status", event.getStatus().name(),
                "eventId", event.getEventId(),
                "eventType", event.getEventType()
        ));
    }

    @PostMapping("/customers")
    @Operation(summary = "Stripe 고객 생성", description = "테스트 모드")
    public ResponseEntity<Map<String, String>> createCustomer(
            @RequestBody @Valid CreateCustomerRequest request
    ) {
        String customerId = billingService.createCustomer(request.getEmail(), request.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("customerId", customerId));
    }

    @PostMapping("/subscriptions")
    @Operation(summary = "구독 생성", description = "테스트 모드")
    public ResponseEntity<Map<String, String>> createSubscription(
            @RequestBody @Valid CreateSubscriptionRequest request
    ) {
        String subscriptionId = billingService.createSubscription(
                request.getCustomerId(),
                request.getPriceId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("subscriptionId", subscriptionId));
    }

    @PostMapping("/subscriptions/{subscriptionId}/cancel")
    @Operation(summary = "구독 취소", description = "테스트 모드")
    public ResponseEntity<Map<String, String>> cancelSubscription(
            @PathVariable String subscriptionId
    ) {
        billingService.cancelSubscription(subscriptionId);
        return ResponseEntity.ok(Map.of("status", "cancelled", "subscriptionId", subscriptionId));
    }
}

