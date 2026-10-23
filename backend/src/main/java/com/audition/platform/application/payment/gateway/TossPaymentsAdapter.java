package com.audition.platform.application.payment.gateway;

import com.audition.platform.application.payment.TossPaymentsClient;
import com.audition.platform.application.payment.TossPaymentsException;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayConfirm;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayRefund;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewaySession;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayWebhook;
import com.audition.platform.application.payment.gateway.GatewayTypes.Outcome;
import com.audition.platform.domain.payment.PaymentOrder;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.EnumSet;
import java.util.Set;

/**
 * 국내 토스와 해외 토스는 설정이 다르고 어댑터는 하나다.
 * 시크릿이 없으면 API를 호출하지 않는다.
 */
@Component
public class TossPaymentsAdapter implements PaymentGateway {

    public static final String CODE = "TOSS";

    private final TossPaymentsClient client;

    public TossPaymentsAdapter(TossPaymentsClient client) {
        this.client = client;
    }

    @Override
    public String adapterCode() {
        return CODE;
    }

    @Override
    public boolean implemented() {
        return true;
    }

    @Override
    public Set<ProviderCapability> capabilities() {
        return EnumSet.of(
                ProviderCapability.ORDER_CREATE,
                ProviderCapability.SESSION,
                ProviderCapability.CONFIRM,
                ProviderCapability.STATUS,
                ProviderCapability.SUCCESS,
                ProviderCapability.FAIL,
                ProviderCapability.USER_CANCEL,
                ProviderCapability.FULL_REFUND,
                ProviderCapability.PARTIAL_REFUND,
                ProviderCapability.WEBHOOK,
                ProviderCapability.RETRY,
                ProviderCapability.IDEMPOTENCY);
    }

    @Override
    public GatewaySession createSession(PaymentOrder order, GatewayContext context) {
        if (context.clientKey() == null || context.clientKey().isBlank()) {
            throw new PaymentGatewayException("TOSS_CLIENT_KEY_MISSING");
        }
        return new GatewaySession("/credits/toss-checkout?orderNo=" + order.getOrderNo(), context.clientKey());
    }

    @Override
    public GatewayConfirm confirm(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        requireSecret(context);
        if (command.paymentKey() == null || command.paymentKey().isBlank()) {
            throw new PaymentGatewayException("TOSS_PAYMENT_KEY_MISSING");
        }
        if (order.getChargeAmountMinor() == null) {
            throw new PaymentGatewayException("CHARGE_AMOUNT_MISSING");
        }
        try {
            JsonNode payload = client.confirm(
                    context.secret(),
                    command.paymentKey().trim(),
                    order.getOrderNo(),
                    order.getChargeAmountMinor());
            String status = payload != null && payload.hasNonNull("status") ? payload.get("status").asText() : "";
            if (!"DONE".equalsIgnoreCase(status)) {
                return new GatewayConfirm(Outcome.FAILED, command.paymentKey(), "TOSS_STATUS_" + status);
            }
            long paid = payload.has("totalAmount") ? payload.get("totalAmount").asLong() : -1;
            if (paid != order.getChargeAmountMinor()) {
                return new GatewayConfirm(Outcome.FAILED, command.paymentKey(), "TOSS_AMOUNT_MISMATCH");
            }
            return new GatewayConfirm(Outcome.PAID, command.paymentKey(), null);
        } catch (TossPaymentsException ex) {
            return new GatewayConfirm(Outcome.FAILED, command.paymentKey(), ex.getTossCode());
        }
    }

    @Override
    public GatewayRefund refund(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        requireSecret(context);
        if (order.getPaymentKey() == null || order.getPaymentKey().isBlank()) {
            throw new PaymentGatewayException("TOSS_PAYMENT_KEY_MISSING");
        }
        try {
            client.cancel(context.secret(), order.getPaymentKey(), "refund");
            return new GatewayRefund(true, order.getPaymentKey());
        } catch (TossPaymentsException ex) {
            throw new PaymentGatewayException(ex.getTossCode());
        }
    }

    @Override
    public GatewayWebhook verifyWebhook(String rawBody, String signature, GatewayContext context) {
        if (context.webhookSecret() == null || signature == null || signature.isBlank()) {
            return new GatewayWebhook(false, null, null, null);
        }
        String expected = hmac(rawBody == null ? "" : rawBody, context.webhookSecret());
        if (!expected.equals(signature)) {
            return new GatewayWebhook(false, null, null, null);
        }
        return new GatewayWebhook(true, null, null, Outcome.PENDING);
    }

    private static void requireSecret(GatewayContext context) {
        if (context.secret() == null || context.secret().isBlank()) {
            throw new PaymentGatewayException("TOSS_SECRET_MISSING");
        }
    }

    private static String hmac(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new PaymentGatewayException("TOSS_WEBHOOK_SIGN_FAILED");
        }
    }
}
