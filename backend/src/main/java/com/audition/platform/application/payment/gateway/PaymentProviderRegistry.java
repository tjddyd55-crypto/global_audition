package com.audition.platform.application.payment.gateway;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PaymentProviderRegistry {

    private final Map<String, PaymentGateway> byCode;

    public PaymentProviderRegistry(List<PaymentGateway> gateways) {
        this.byCode = gateways.stream()
                .collect(Collectors.toMap(g -> g.adapterCode().toUpperCase(Locale.ROOT), Function.identity(), (a, b) -> a));
    }

    public PaymentGateway require(String adapterCode) {
        if (adapterCode == null) {
            throw new PaymentGatewayException("ADAPTER_MISSING");
        }
        PaymentGateway gateway = byCode.get(adapterCode.trim().toUpperCase(Locale.ROOT));
        if (gateway == null || !gateway.implemented()) {
            throw new PaymentGatewayException("ADAPTER_NOT_IMPLEMENTED");
        }
        return gateway;
    }
}
