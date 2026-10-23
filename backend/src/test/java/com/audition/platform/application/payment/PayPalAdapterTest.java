package com.audition.platform.application.payment;

import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayCommand;
import com.audition.platform.application.payment.gateway.GatewayTypes.GatewayContext;
import com.audition.platform.application.payment.gateway.PayPalAdapter;
import com.audition.platform.application.payment.gateway.PaymentGatewayException;
import com.audition.platform.domain.payment.PaymentOrder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PayPalAdapterTest {

    @Test
    void missingSandboxCredentialsDoNotConfirm() {
        PayPalAdapter adapter = new PayPalAdapter(new ObjectMapper());
        assertTrue(adapter.implemented());
        assertFalse(adapter.capabilities().isEmpty());
        PaymentOrder order = new PaymentOrder();
        order.setOrderNo("ORD-PAYPAL");
        GatewayContext empty = new GatewayContext("PAYPAL", "TEST", null, null, null, null);
        assertThrows(PaymentGatewayException.class, () -> adapter.createSession(order, empty));
        assertThrows(PaymentGatewayException.class,
                () -> adapter.confirm(order, new GatewayCommand("SUCCESS", 100L, "ORDER", null, 0), empty));
    }
}
