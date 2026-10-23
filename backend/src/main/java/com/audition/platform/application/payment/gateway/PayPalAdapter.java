package com.audition.platform.application.payment.gateway;

import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayConfirm;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayRefund;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewaySession;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayWebhook;
import com.audition.platform.application.payment.gateway.GatewayTypes.Outcome;
import com.audition.platform.domain.payment.PaymentOrder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.EnumSet;
import java.util.Set;

/**
 * PayPal Sandbox. 자격 증명이 없으면 주문을 만들지 않고 성공으로 처리하지 않는다.
 * 문서: https://developer.paypal.com/docs/api/orders/v2/
 */
@Component
public class PayPalAdapter implements PaymentGateway {

    public static final String CODE = "PAYPAL";
    static final String SANDBOX_API = "https://api-m.sandbox.paypal.com";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public PayPalAdapter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
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
                ProviderCapability.WEBHOOK,
                ProviderCapability.IDEMPOTENCY);
    }

    @Override
    public GatewaySession createSession(PaymentOrder order, GatewayContext context) {
        requireCredentials(context);
        return new GatewaySession("/credits/paypal?orderNo=" + order.getOrderNo(), context.clientId());
    }

    @Override
    public GatewayConfirm confirm(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        requireCredentials(context);
        if (command.paymentKey() == null || command.paymentKey().isBlank()) {
            throw new PaymentGatewayException("PAYPAL_ORDER_ID_MISSING");
        }
        try {
            String token = accessToken(context);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SANDBOX_API + "/v2/checkout/orders/" + command.paymentKey().trim() + "/capture"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return new GatewayConfirm(Outcome.FAILED, command.paymentKey(), "PAYPAL_CAPTURE_FAILED");
            }
            JsonNode json = objectMapper.readTree(response.body());
            String status = json.path("status").asText("");
            if (!"COMPLETED".equalsIgnoreCase(status)) {
                return new GatewayConfirm(Outcome.FAILED, command.paymentKey(), "PAYPAL_STATUS_" + status);
            }
            return new GatewayConfirm(Outcome.PAID, command.paymentKey(), null);
        } catch (PaymentGatewayException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return new GatewayConfirm(Outcome.RETRYABLE, command.paymentKey(), "PAYPAL_INTERRUPTED");
        } catch (Exception ex) {
            return new GatewayConfirm(Outcome.RETRYABLE, command.paymentKey(), "PAYPAL_NETWORK");
        }
    }

    @Override
    public GatewayRefund refund(PaymentOrder order, GatewayCommand command, GatewayContext context) {
        requireCredentials(context);
        throw new PaymentGatewayException("PAYPAL_REFUND_REQUIRES_CAPTURE_ID");
    }

    @Override
    public GatewayWebhook verifyWebhook(String rawBody, String signature, GatewayContext context) {
        if (context.webhookSecret() == null || signature == null) {
            return new GatewayWebhook(false, null, null, null);
        }
        String expected = hmac(rawBody == null ? "" : rawBody, context.webhookSecret());
        if (!expected.equals(signature)) {
            return new GatewayWebhook(false, null, null, null);
        }
        return new GatewayWebhook(true, null, null, Outcome.PENDING);
    }

    private static void requireCredentials(GatewayContext context) {
        if (context.clientId() == null || context.clientId().isBlank()
                || context.secret() == null || context.secret().isBlank()) {
            throw new PaymentGatewayException("PAYPAL_NOT_CONFIGURED");
        }
    }

    private String accessToken(GatewayContext context) throws Exception {
        String basic = Base64.getEncoder().encodeToString(
                (context.clientId() + ":" + context.secret()).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(SANDBOX_API + "/v1/oauth2/token"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Basic " + basic)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new PaymentGatewayException("PAYPAL_AUTH_FAILED");
        }
        JsonNode json = objectMapper.readTree(response.body());
        String token = json.path("access_token").asText("");
        if (token.isBlank()) {
            throw new PaymentGatewayException("PAYPAL_AUTH_FAILED");
        }
        return token;
    }

    private static String hmac(String body, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new PaymentGatewayException("PAYPAL_WEBHOOK_SIGN_FAILED");
        }
    }
}
