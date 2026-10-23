package com.audition.platform.application.payment;

/**
 * 결제수단은 결제 국가·가맹 계약 국가·승인 범위·통화·환경·활성화·구현·연결이 모두 맞을 때만 노출한다.
 * 국적만으로 고르지 않는다.
 */
public final class PaymentMethodGate {

    private PaymentMethodGate() {
    }

    public static boolean available(MethodOffer offer, boolean mockAllowed, boolean liveExecutionAllowed) {
        if (offer == null || !offer.methodEnabled() || !offer.providerEnabled() || !offer.implemented()) {
            return false;
        }
        if (offer.paymentCountry() == null || offer.merchantCountry() == null || offer.currency() == null) {
            return false;
        }
        if (!contains(offer.providerCountries(), offer.paymentCountry())) {
            return false;
        }
        if (!contains(offer.providerCurrencies(), offer.currency())) {
            return false;
        }
        if (!contains(offer.providerMethods(), offer.methodCode())) {
            return false;
        }
        String status = offer.contractStatus() == null ? "" : offer.contractStatus();
        if ("APPROVAL_PENDING".equals(status) || "NOT_CONFIGURED".equals(status)
                || "TEST_FAILED".equals(status) || "DISABLED".equals(status)) {
            return false;
        }
        if ("MOCK".equals(offer.environment())) {
            return mockAllowed && "TEST_READY".equals(status) && "CONNECTED".equals(offer.connectionStatus());
        }
        if ("LIVE".equals(offer.environment())) {
            return liveExecutionAllowed && "LIVE_READY".equals(status) && "CONNECTED".equals(offer.connectionStatus());
        }
        return "TEST".equals(offer.environment())
                && "TEST_READY".equals(status)
                && "CONNECTED".equals(offer.connectionStatus());
    }

    private static boolean contains(String csv, String token) {
        if (csv == null || token == null || token.isBlank()) {
            return false;
        }
        for (String part : csv.split(",")) {
            if (token.equalsIgnoreCase(part.trim())) {
                return true;
            }
        }
        return false;
    }

    public record MethodOffer(
            String providerId,
            String environment,
            String contractStatus,
            String connectionStatus,
            boolean providerEnabled,
            boolean implemented,
            String providerCountries,
            String providerCurrencies,
            String providerMethods,
            String paymentCountry,
            String merchantCountry,
            String methodCode,
            String currency,
            boolean methodEnabled) {
    }
}
