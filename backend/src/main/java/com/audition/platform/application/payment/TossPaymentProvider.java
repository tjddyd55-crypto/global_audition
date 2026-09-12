package com.audition.platform.application.payment;

import com.audition.platform.domain.payment.PaymentOrder;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class TossPaymentProvider implements PaymentProvider {

    public static final String CODE = "TOSS_PAYMENTS";
    public static final String LEGACY_CODE = "TOSS";

    @Override
    public String getCode() {
        return CODE;
    }

    @Override
    public PaymentPrepareResult preparePayment(PaymentOrder order) {
        String q = URLEncoder.encode(order.getOrderNo(), StandardCharsets.UTF_8);
        return new PaymentPrepareResult("/credits/toss-checkout?orderNo=" + q);
    }
}
