package com.audition.platform.infrastructure.stripe;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.SubscriptionCreateParams;
import com.stripe.param.SubscriptionCancelParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Stripe 서비스
 * 작업: 2026_08_stripe_payment
 */
@Service
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostConstruct
    public void init() {
        if (secretKey != null && !secretKey.isEmpty()) {
            Stripe.apiKey = secretKey;
            log.info("Stripe API 키 초기화 완료 (테스트 모드)");
        } else {
            log.warn("Stripe API 키가 설정되지 않았습니다. 테스트 모드로 동작합니다.");
        }
    }

    /**
     * Stripe 고객 생성
     * 
     * @param email 고객 이메일
     * @param name 고객 이름
     * @return Stripe Customer ID
     */
    public String createCustomer(String email, String name) {
        try {
            CustomerCreateParams params = CustomerCreateParams.builder()
                    .setEmail(email)
                    .setName(name)
                    .build();

            Customer customer = Customer.create(params);
            log.info("Stripe 고객 생성 완료: customerId={}, email={}", customer.getId(), email);
            return customer.getId();
        } catch (Exception e) {
            log.error("Stripe 고객 생성 실패: email={}", email, e);
            throw new RuntimeException("Stripe 고객 생성 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 구독 생성
     * 
     * @param customerId Stripe 고객 ID
     * @param priceId 가격 ID (테스트 모드용)
     * @return Stripe Subscription ID
     */
    public String createSubscription(String customerId, String priceId) {
        try {
            SubscriptionCreateParams params = SubscriptionCreateParams.builder()
                    .setCustomer(customerId)
                    .addItem(SubscriptionCreateParams.Item.builder()
                            .setPrice(priceId)
                            .build())
                    .build();

            Subscription subscription = Subscription.create(params);
            log.info("Stripe 구독 생성 완료: subscriptionId={}, customerId={}", subscription.getId(), customerId);
            return subscription.getId();
        } catch (Exception e) {
            log.error("Stripe 구독 생성 실패: customerId={}", customerId, e);
            throw new RuntimeException("Stripe 구독 생성 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 구독 취소
     * 
     * @param subscriptionId 구독 ID
     */
    public void cancelSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(subscriptionId);
            SubscriptionCancelParams params = SubscriptionCancelParams.builder().build();
            subscription.cancel(params);
            log.info("Stripe 구독 취소 완료: subscriptionId={}", subscriptionId);
        } catch (Exception e) {
            log.error("Stripe 구독 취소 실패: subscriptionId={}", subscriptionId, e);
            throw new RuntimeException("Stripe 구독 취소 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Payment Intent 생성 (포인트 충전용)
     * 작업: POINTS_03_stripe_topup
     * 
     * @param amount 결제 금액 (원 단위)
     * @param customerEmail 고객 이메일
     * @param metadata 추가 메타데이터 (userId, points 등)
     * @return Payment Intent 객체
     */
    public PaymentIntent createPaymentIntent(Long amount, String customerEmail, java.util.Map<String, String> metadata) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amount) // 원 단위 (예: 1000원)
                    .setCurrency("krw")
                    .setDescription("포인트 충전")
                    .putMetadata("purpose", "point_topup")
                    .putAllMetadata(metadata)
                    .build();

            PaymentIntent paymentIntent = PaymentIntent.create(params);
            log.info("Payment Intent 생성 완료: paymentIntentId={}, amount={}", paymentIntent.getId(), amount);
            return paymentIntent;
        } catch (Exception e) {
            log.error("Payment Intent 생성 실패: amount={}", amount, e);
            throw new RuntimeException("Payment Intent 생성 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Payment Intent 조회
     * 작업: POINTS_03_stripe_topup
     */
    public PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            return paymentIntent;
        } catch (Exception e) {
            log.error("Payment Intent 조회 실패: paymentIntentId={}", paymentIntentId, e);
            throw new RuntimeException("Payment Intent 조회 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Webhook 서명 검증
     * 
     * @param payload 웹훅 페이로드
     * @param signature Stripe 서명
     * @return 검증된 이벤트 객체
     */
    public com.stripe.model.Event verifyWebhookSignature(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            log.warn("Webhook Secret이 설정되지 않았습니다. 서명 검증을 건너뜁니다.");
            // 테스트 환경에서는 서명 검증을 건너뛸 수 있음
            try {
                return com.stripe.net.ApiResource.GSON.fromJson(payload, com.stripe.model.Event.class);
            } catch (Exception e) {
                throw new RuntimeException("Webhook 페이로드 파싱 실패", e);
            }
        }

        try {
            com.stripe.model.Event event = Webhook.constructEvent(payload, signature, webhookSecret);
            log.info("Webhook 서명 검증 성공: eventId={}, eventType={}", event.getId(), event.getType());
            return event;
        } catch (SignatureVerificationException e) {
            log.error("Webhook 서명 검증 실패: {}", e.getMessage());
            throw new RuntimeException("Webhook 서명 검증 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Webhook 처리 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook 처리 실패: " + e.getMessage(), e);
        }
    }
}
