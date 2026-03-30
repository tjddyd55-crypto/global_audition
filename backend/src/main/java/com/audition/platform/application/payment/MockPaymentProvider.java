package com.audition.platform.application.payment;

import com.audition.platform.domain.payment.PaymentOrder;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class MockPaymentProvider implements PaymentProvider {

    /**
     * 실제 Stripe 연동 시 {@link UsdMoney#toStripeCents(java.math.BigDecimal)} 로
     * {@code PaymentIntent} 금액을 설정한다.
     */
    public static final String CODE = "MOCK";

    @Override
    public String getCode() {
        return CODE;
    }

    @Override
    public PaymentPrepareResult preparePayment(PaymentOrder order) {
        String q = URLEncoder.encode(order.getOrderNo(), StandardCharsets.UTF_8);
        return new PaymentPrepareResult("/credits/mock-pay?orderNo=" + q);
    }
}
