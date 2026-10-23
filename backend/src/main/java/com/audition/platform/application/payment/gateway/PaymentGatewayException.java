package com.audition.platform.application.payment.gateway;

public class PaymentGatewayException extends RuntimeException {

    public PaymentGatewayException(String code) {
        super(code);
    }
}
