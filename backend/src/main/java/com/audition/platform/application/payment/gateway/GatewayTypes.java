package com.audition.platform.application.payment.gateway;

public final class GatewayTypes {

    private GatewayTypes() {
    }

    public enum Outcome {
        PAID,
        FAILED,
        CANCELLED,
        PENDING,
        RETRYABLE
    }

    public record GatewayContext(
            String providerId,
            String environment,
            String clientKey,
            String clientId,
            String secret,
            String webhookSecret) {
    }

    public record GatewayCommand(
            String scenario,
            Long chargeAmountMinor,
            String paymentKey,
            String idempotencyKey,
            long refundMinor) {
    }

    public record GatewaySession(String redirectPath, String clientKey) {
    }

    public record GatewayConfirm(Outcome outcome, String providerTxId, String reason) {
    }

    public record GatewayRefund(boolean accepted, String providerRefundId) {
    }

    public record GatewayWebhook(boolean signatureValid, String eventId, String orderNo, Outcome outcome) {
    }
}
