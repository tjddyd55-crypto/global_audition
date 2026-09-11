package com.audition.platform.application.payment;

import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * 승인 실패를 별도 트랜잭션으로 남겨, confirm 의 예외 롤백이 FAILED 를 지우지 않게 한다.
 */
@Service
public class PaymentOrderFailureRecorder {

    private final PaymentOrderRepository paymentOrderRepository;

    public PaymentOrderFailureRecorder(PaymentOrderRepository paymentOrderRepository) {
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailed(String orderNo, String reason) {
        PaymentOrder order = paymentOrderRepository.findByOrderNoForUpdate(orderNo).orElse(null);
        if (order == null || order.getStatus() == PaymentOrderStatus.PAID) {
            return;
        }
        order.setStatus(PaymentOrderStatus.FAILED);
        order.setFailReason(reason);
        order.setUpdatedAt(Instant.now());
        paymentOrderRepository.save(order);
    }
}
