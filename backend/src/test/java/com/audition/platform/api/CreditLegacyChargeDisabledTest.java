package com.audition.platform.api;

import com.audition.platform.api.dto.CreditChargeRequest;
import com.audition.platform.application.credit.CreditLotRemainingQuery;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.application.payment.PaymentOrderService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class CreditLegacyChargeDisabledTest {

    @Test
    void defaultOffRejectsChargeWithoutTouchingTheLedger() {
        CreditService credits = mock(CreditService.class);
        CreditController controller = new CreditController(
                credits,
                mock(PaymentOrderService.class),
                mock(CreditLotRemainingQuery.class),
                false);
        CreditChargeRequest request = new CreditChargeRequest();
        request.setAmount(1L);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.charge(request));

        assertEquals(403, ex.getStatusCode().value());
        verify(credits, never()).chargeCredits(any(), anyLong());
    }
}
