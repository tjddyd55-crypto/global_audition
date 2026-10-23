package com.audition.platform.application.payment.gateway;

import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayConfirm;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayRefund;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewaySession;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayWebhook;
import com.audition.platform.domain.payment.PaymentOrder;

import java.util.Set;

/**
 * 하나의 PG 연동. 결제수단은 공급자와 별개이며 한 어댑터가 여러 수단을 가진다.
 */
public interface PaymentGateway {

    String adapterCode();

    boolean implemented();

    Set<ProviderCapability> capabilities();

    GatewaySession createSession(PaymentOrder order, GatewayContext context);

    GatewayConfirm confirm(PaymentOrder order, GatewayCommand command, GatewayContext context);

    GatewayRefund refund(PaymentOrder order, GatewayCommand command, GatewayContext context);

    GatewayWebhook verifyWebhook(String rawBody, String signature, GatewayContext context);
}
