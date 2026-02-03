package com.audition.platform.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 포인트 거래 내역 엔티티
 * 작업: POINTS_01_system_design, POINTS_02_backend_points
 */
@Entity
@Table(name = "point_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 50)
    private TransactionType transactionType; // CHARGE(충전), DEDUCTION(차감), REFUND(환불)

    @Column(nullable = false)
    private Long amount; // 포인트 양 (양수: 충전, 음수: 차감)

    @Column(name = "balance_before", nullable = false)
    private Long balanceBefore; // 거래 전 잔액

    @Column(name = "balance_after", nullable = false)
    private Long balanceAfter; // 거래 후 잔액

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 50)
    private EventType eventType; // AUDITION_APPLICATION, CONTENT_ACCESS, STRIPE_TOPUP 등

    @Column(name = "related_id")
    private Long relatedId; // 관련 엔티티 ID (오디션 ID, 콘텐츠 ID 등)

    @Column(columnDefinition = "TEXT")
    private String description; // 거래 설명

    @Column(name = "stripe_payment_intent_id", length = 255)
    private String stripePaymentIntentId; // Stripe 결제 ID (충전인 경우)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.COMPLETED; // COMPLETED, PENDING, FAILED, ROLLED_BACK

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum TransactionType {
        CHARGE,    // 충전
        DEDUCTION, // 차감
        REFUND     // 환불
    }

    public enum EventType {
        STRIPE_TOPUP,        // Stripe 충전
        AUDITION_APPLICATION, // 오디션 지원
        CONTENT_ACCESS,      // 유료 콘텐츠 접근
        REFUND               // 환불
    }

    public enum TransactionStatus {
        COMPLETED,  // 완료
        PENDING,    // 대기
        FAILED,     // 실패
        ROLLED_BACK // 롤백됨
    }
}
