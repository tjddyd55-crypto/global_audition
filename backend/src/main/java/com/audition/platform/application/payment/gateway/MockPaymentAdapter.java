package com.audition.platform.application.payment.gateway;

import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayConfirm;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayRefund;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewaySession;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayWebhook;
import com.audition.platform.application.payment.gateway.GatewayTypes.Outcome;
import com.audition.platform.domain.payment.PaymentOrder;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.Set;

/**
 * 키 없이 개발·테스트 전용으로 성공, 실패, 취소, 지연, 네트워크 오류, 환불을 재현한다.
 * 운영 프로필에서는 PaymentEnvironmentGuard 가 호출 자체를 막는다.
 */
@Component
public class MockPaymentAdapter implements PaymentGateway {

    public static final String CODE = "MOCK";

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
        return EnumSet.allOf(ProviderCapability.class);
    }

    @Override
    public GatewaySession createSession(PaymentOrder order, GatewayContext context) {
        return new GatewaySession("/credits/pay?orderNo=" + order.getOrderNo(), null);
    }

    @Override
    public GatewayConfirm confirm(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        String scenario = command.scenario() == null ? "SUCCESS" : command.scenario().trim().toUpperCase();
        return switch (scenario) {
            case "FAIL" -> new GatewayConfirm(Outcome.FAILED, null, "MOCK_FAIL");
            case "CANCEL" -> new GatewayConfirm(Outcome.CANCELLED, null, "USER_CANCEL");
            case "NETWORK" -> new GatewayConfirm(Outcome.RETRYABLE, null, "NETWORK_ERROR");
            case "DELAYED" -> new GatewayConfirm(Outcome.PENDING, null, "DELAYED_APPROVAL");
            case "SUCCESS" -> new GatewayConfirm(Outcome.PAID, "MOCK-" + order.getOrderNo(), null);
            default -> new GatewayConfirm(Outcome.FAILED, null, "MOCK_SCENARIO_UNKNOWN");
        };
    }

    @Override
    public GatewayRefund refund(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        if ("NETWORK".equalsIgnoreCase(command.scenario())) {
            return new GatewayRefund(false, null);
        }
        return new GatewayRefund(true, "MOCK-REFUND-" + order.getOrderNo());
    }

    @Override
    public GatewayWebhook verifyWebhook(String rawBody, String signature, GatewayContext context) {
        if (context.webhookSecret() == null || signature == null || !sign(rawBody, context.webhookSecret()).equals(signature)) {
            return new GatewayWebhook(false, null, null, null);
        }
        String eventId = field(rawBody, "eventId");
        String orderNo = field(rawBody, "orderNo");
        String type = field(rawBody, "type");
        Outcome outcome = switch (type == null ? "" : type) {
            case "PAYMENT_SUCCESS" -> Outcome.PAID;
            case "PAYMENT_FAIL" -> Outcome.FAILED;
            case "PAYMENT_CANCEL" -> Outcome.CANCELLED;
            default -> Outcome.FAILED;
        };
        return new GatewayWebhook(true, eventId, orderNo, outcome);
    }

    public static String sign(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("MOCK_WEBHOOK_SIGN_FAILED", ex);
        }
    }

    private static String field(String body, String name) {
        if (body == null) {
            return null;
        }
        String needle = "\"" + name + "\":\"";
        int start = body.indexOf(needle);
        if (start < 0) {
            return null;
        }
        int from = start + needle.length();
        int end = body.indexOf('"', from);
        if (end < 0) {
            return null;
        }
        return body.substring(from, end);
    }
}
