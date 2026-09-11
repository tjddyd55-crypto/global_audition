package com.audition.platform.application.payment;

import com.audition.platform.api.dto.CreditOrderSummaryResponse;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.domain.credit.CreditPackage;
import com.audition.platform.domain.credit.CreditPackageRepository;
import com.audition.platform.domain.payment.PaymentOrder;
import com.audition.platform.domain.payment.PaymentOrderRepository;
import com.audition.platform.domain.payment.PaymentOrderStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentOrderServiceTest {

    private PaymentOrderRepository orderRepository;
    private CreditPackageRepository packageRepository;
    private CreditService creditService;
    private PaymentSettingsService settingsService;
    private TossPaymentsClient tossClient;
    private PaymentOrderService service;

    @BeforeEach
    void setUp() {
        orderRepository = mock(PaymentOrderRepository.class);
        packageRepository = mock(CreditPackageRepository.class);
        creditService = mock(CreditService.class);
        settingsService = mock(PaymentSettingsService.class);
        tossClient = mock(TossPaymentsClient.class);
        service = new PaymentOrderService(
                orderRepository,
                packageRepository,
                creditService,
                settingsService,
                tossClient,
                List.of(new MockPaymentProvider(), new TossPaymentProvider()));
    }

    @Test
    void confirmRejectsCurrencyMismatchWithoutCallingToss() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-KRW", new BigDecimal("10"));
        order.setCurrency("KRW");
        when(orderRepository.findByPaymentKey("pk-fx")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNoForUpdate("ORD-KRW")).thenReturn(Optional.of(order));

        assertThrows(ResponseStatusException.class,
                () -> service.confirmToss(userId, "pk-fx", "ORD-KRW", 10));
        verify(tossClient, never()).confirm(any(), any(), any(), anyLong());
    }

    @Test
    void confirmRejectsAmountMismatchWithoutCallingToss() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-1", new BigDecimal("10"));
        when(orderRepository.findByPaymentKey("pk-1")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNoForUpdate("ORD-1")).thenReturn(Optional.of(order));

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.confirmToss(userId, "pk-1", "ORD-1", 999));
        assertEquals(400, ex.getStatusCode().value());
        verify(tossClient, never()).confirm(any(), any(), any(), anyLong());
        verify(creditService, never()).applyChargeFromPaymentOrder(any());
    }

    @Test
    void confirmIsIdempotentOnSamePaymentKey() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-1", new BigDecimal("10"));
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaymentKey("pk-1");
        when(orderRepository.findByPaymentKey("pk-1")).thenReturn(Optional.of(order));
        when(orderRepository.findByOrderNoForUpdate("ORD-1")).thenReturn(Optional.of(order));
        when(packageRepository.findById(order.getPackageId())).thenReturn(Optional.of(activePackage(order.getPackageId())));

        CreditOrderSummaryResponse res = service.confirmToss(userId, "pk-1", "ORD-1", 10);
        assertEquals("PAID", res.getStatus());
        verify(tossClient, never()).confirm(any(), any(), any(), anyLong());
        verify(creditService, never()).applyChargeFromPaymentOrder(any());
    }

    @Test
    void confirmPaysAndGrantsCredits() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-1", new BigDecimal("5"));
        CreditPackage pkg = activePackage(order.getPackageId());
        when(orderRepository.findByPaymentKey("pk-ok")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNoForUpdate("ORD-1")).thenReturn(Optional.of(order));
        when(packageRepository.findById(order.getPackageId())).thenReturn(Optional.of(pkg));
        when(settingsService.requireActiveSecret()).thenReturn("test_sk_dummy");
        when(tossClient.confirm(eq("test_sk_dummy"), eq("pk-ok"), eq("ORD-1"), eq(5L)))
                .thenReturn(new ObjectMapper().createObjectNode());

        CreditOrderSummaryResponse res = service.confirmToss(userId, "pk-ok", "ORD-1", 5);
        assertEquals(PaymentOrderStatus.PAID, order.getStatus());
        assertEquals("pk-ok", order.getPaymentKey());
        assertEquals("PAID", res.getStatus());
        verify(creditService).applyChargeFromPaymentOrder(order);
    }

    @Test
    void confirmFailureMarksFailedAndDoesNotGrant() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-1", new BigDecimal("5"));
        when(orderRepository.findByPaymentKey("pk-bad")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNoForUpdate("ORD-1")).thenReturn(Optional.of(order));
        when(packageRepository.findById(order.getPackageId())).thenReturn(Optional.of(activePackage(order.getPackageId())));
        when(settingsService.requireActiveSecret()).thenReturn("test_sk_dummy");
        when(tossClient.confirm(any(), any(), any(), anyLong()))
                .thenThrow(new TossPaymentsException(400, "REJECTED", "승인 실패"));

        assertThrows(ResponseStatusException.class, () -> service.confirmToss(userId, "pk-bad", "ORD-1", 5));
        assertEquals(PaymentOrderStatus.FAILED, order.getStatus());
        verify(creditService, never()).applyChargeFromPaymentOrder(any());
    }

    @Test
    void cancelBlocksWhenCreditsAlreadySpent() {
        UUID userId = UUID.randomUUID();
        PaymentOrder order = readyTossOrder(userId, "ORD-1", new BigDecimal("10"));
        order.setStatus(PaymentOrderStatus.PAID);
        order.setPaidAt(Instant.now());
        order.setPaymentKey("pk-1");
        when(orderRepository.findByOrderNoForUpdate("ORD-1")).thenReturn(Optional.of(order));
        when(creditService.hasSpentCreditsSince(eq(userId), any())).thenReturn(true);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.cancelToss(userId, "ORD-1", "테스트", false));
        assertEquals(409, ex.getStatusCode().value());
        verify(tossClient, never()).cancel(any(), any(), any());
    }

    private static PaymentOrder readyTossOrder(UUID userId, String orderNo, BigDecimal amount) {
        PaymentOrder order = new PaymentOrder();
        order.setId(UUID.randomUUID());
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setPackageId(UUID.randomUUID());
        order.setProvider(TossPaymentProvider.CODE);
        order.setAmount(amount);
        order.setCurrency("USD");
        order.setStatus(PaymentOrderStatus.READY);
        order.setCredits(10);
        order.setBonusCredits(0);
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        return order;
    }

    private static CreditPackage activePackage(UUID id) {
        CreditPackage pkg = new CreditPackage();
        pkg.setId(id);
        pkg.setName("Starter");
        pkg.setPrice(new BigDecimal("10"));
        pkg.setCredits(10);
        pkg.setBonusCredits(0);
        pkg.setActive(true);
        return pkg;
    }
}
