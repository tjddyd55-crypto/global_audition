package com.audition.platform.application.service;

import com.audition.platform.application.dto.CreatePointTopupRequest;
import com.audition.platform.application.dto.PointTopupResponse;
import com.audition.platform.domain.entity.PointTransaction;
import com.audition.platform.domain.entity.User;
import com.audition.platform.domain.repository.UserRepository;
import com.audition.platform.infrastructure.stripe.StripeService;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * 포인트 충전 서비스
 * 작업: POINTS_03_stripe_topup
 * 
 * Stripe는 포인트 충전용으로만 사용
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PointTopupService {

    private final StripeService stripeService;
    private final PointService pointService;
    private final UserRepository userRepository;

    @Value("${points.exchange-rate:1}")
    private Long exchangeRate; // 1원 = 1포인트 (기본값)

    /**
     * 포인트 충전 Payment Intent 생성
     */
    public PointTopupResponse createTopupIntent(Long userId, CreatePointTopupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Long points = request.getPoints();
        Long amount = points * exchangeRate; // 포인트 * 환율 = 결제 금액 (원)

        // 메타데이터 설정
        Map<String, String> metadata = new HashMap<>();
        metadata.put("userId", userId.toString());
        metadata.put("points", points.toString());
        metadata.put("email", user.getEmail());

        // Payment Intent 생성
        PaymentIntent paymentIntent = stripeService.createPaymentIntent(amount, user.getEmail(), metadata);

        log.info("포인트 충전 Intent 생성: userId={}, points={}, amount={}, paymentIntentId={}", 
                userId, points, amount, paymentIntent.getId());

        return PointTopupResponse.builder()
                .paymentIntentId(paymentIntent.getId())
                .clientSecret(paymentIntent.getClientSecret())
                .points(points)
                .amount(amount)
                .build();
    }

    /**
     * Payment Intent 성공 시 포인트 충전 처리
     * Webhook에서 호출
     */
    public void processTopupSuccess(String paymentIntentId) {
        // 중복 처리 방지: 이미 처리된 거래인지 확인
        if (pointService.isTransactionExists(paymentIntentId)) {
            log.warn("이미 처리된 Payment Intent: paymentIntentId={}", paymentIntentId);
            return;
        }

        PaymentIntent paymentIntent = stripeService.retrievePaymentIntent(paymentIntentId);

        // 메타데이터에서 정보 추출
        Map<String, String> metadata = paymentIntent.getMetadata();
        Long userId = Long.parseLong(metadata.get("userId"));
        Long points = Long.parseLong(metadata.get("points"));

        // 포인트 충전
        pointService.chargePoints(
                userId,
                points,
                PointTransaction.EventType.STRIPE_TOPUP,
                paymentIntentId,
                "Stripe 결제를 통한 포인트 충전"
        );

        log.info("포인트 충전 완료: userId={}, points={}, paymentIntentId={}", 
                userId, points, paymentIntentId);
    }
}
