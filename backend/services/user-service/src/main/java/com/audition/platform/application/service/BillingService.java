package com.audition.platform.application.service;

import com.audition.platform.application.service.PointTopupService;
import com.audition.platform.domain.entity.StripeWebhookEvent;
import com.audition.platform.domain.repository.StripeWebhookEventRepository;
import com.audition.platform.infrastructure.stripe.StripeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 결제 서비스
 * 작업: 2026_08_stripe_payment
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BillingService {

    private final StripeWebhookEventRepository stripeWebhookEventRepository;
    private final StripeService stripeService;
    private final PointTopupService pointTopupService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Webhook 이벤트 저장 (서명 검증 포함)
     * 작업: 2026_08_stripe_payment
     */
    public StripeWebhookEvent saveWebhookEvent(String payload, String signature) {
        // Webhook 서명 검증
        Event stripeEvent = stripeService.verifyWebhookSignature(payload, signature);
        
        String eventId = stripeEvent.getId();
        String eventType = stripeEvent.getType();

        // Idempotency: 동일한 eventId가 이미 처리되었는지 확인
        Optional<StripeWebhookEvent> existing = stripeWebhookEventRepository.findByEventId(eventId);
        if (existing.isPresent()) {
            StripeWebhookEvent duplicate = existing.get();
            duplicate.setStatus(StripeWebhookEvent.WebhookStatus.DUPLICATE);
            log.info("중복 Webhook 이벤트 감지: eventId={}", eventId);
            return stripeWebhookEventRepository.save(duplicate);
        }

        // 새 이벤트 저장
        StripeWebhookEvent event = StripeWebhookEvent.builder()
                .eventId(eventId)
                .eventType(eventType)
                .payload(payload)
                .signature(signature)
                .status(StripeWebhookEvent.WebhookStatus.VERIFIED)
                .receivedAt(LocalDateTime.now())
                .build();

        StripeWebhookEvent saved = stripeWebhookEventRepository.save(event);
        log.info("Webhook 이벤트 저장 완료: eventId={}, eventType={}", eventId, eventType);

        // 포인트 충전 이벤트 처리 (작업: POINTS_03_stripe_topup)
        if ("payment_intent.succeeded".equals(eventType)) {
            try {
                processPaymentIntentSucceeded(payload);
                saved.setStatus(StripeWebhookEvent.WebhookStatus.PROCESSED);
                stripeWebhookEventRepository.save(saved);
            } catch (Exception e) {
                log.error("Payment Intent 처리 실패: eventId={}", eventId, e);
                saved.setStatus(StripeWebhookEvent.WebhookStatus.FAILED);
                stripeWebhookEventRepository.save(saved);
            }
        }

        return saved;
    }

    /**
     * Payment Intent 성공 이벤트 처리
     * 작업: POINTS_03_stripe_topup
     */
    private void processPaymentIntentSucceeded(String payload) {
        try {
            JsonNode jsonNode = parsePayload(payload);
            JsonNode dataNode = jsonNode.get("data");
            if (dataNode == null || !dataNode.has("object")) {
                log.warn("Payment Intent 데이터가 없습니다");
                return;
            }

            JsonNode paymentIntentNode = dataNode.get("object");
            String paymentIntentId = paymentIntentNode.get("id").asText();

            // 포인트 충전 처리
            pointTopupService.processTopupSuccess(paymentIntentId);
            log.info("Payment Intent 처리 완료: paymentIntentId={}", paymentIntentId);
        } catch (Exception e) {
            log.error("Payment Intent 처리 중 오류", e);
            throw new RuntimeException("Payment Intent 처리 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Stripe 고객 생성
     */
    public String createCustomer(String email, String name) {
        return stripeService.createCustomer(email, name);
    }

    /**
     * 구독 생성
     */
    public String createSubscription(String customerId, String priceId) {
        return stripeService.createSubscription(customerId, priceId);
    }

    /**
     * 구독 취소
     */
    public void cancelSubscription(String subscriptionId) {
        stripeService.cancelSubscription(subscriptionId);
    }

    private JsonNode parsePayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception ex) {
            throw new RuntimeException("Stripe webhook payload parse failed", ex);
        }
    }

    private String extractEventId(JsonNode node) {
        JsonNode idNode = node.get("id");
        if (idNode != null && idNode.isTextual()) {
            return idNode.asText();
        }
        throw new RuntimeException("Stripe webhook event id missing");
    }

    private String extractEventType(JsonNode node) {
        JsonNode typeNode = node.get("type");
        if (typeNode != null && typeNode.isTextual()) {
            return typeNode.asText();
        }
        return "unknown";
    }
}

