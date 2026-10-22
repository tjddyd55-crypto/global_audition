package com.audition.platform.application.credit;

import com.audition.platform.api.dto.CreditPolicyPublicDto;
import com.audition.platform.application.fee.GlobalApplicationFeeService;
import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import com.audition.platform.domain.credit.CreditTransactionRepository;
import com.audition.platform.domain.credit.UserCredit;
import com.audition.platform.domain.credit.UserCreditRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CreditServiceTest {

    private CreditPolicyRepository policyRepository;
    private UserCreditRepository walletRepository;
    private CreditTransactionRepository txRepository;
    private CreditService creditService;
    private GlobalApplicationFeeService applicationFeeService;

    @BeforeEach
    void setUp() {
        policyRepository = mock(CreditPolicyRepository.class);
        walletRepository = mock(UserCreditRepository.class);
        txRepository = mock(CreditTransactionRepository.class);
        applicationFeeService = mock(GlobalApplicationFeeService.class);
        CreditPolicyPublicSnapshotCache cache = new CreditPolicyPublicSnapshotCache();
        creditService = new CreditService(
                policyRepository, walletRepository, txRepository, cache, applicationFeeService);
    }

    @Test
    void zeroGlobalFeeSkipsDeductEvenIfLegacyPolicyHasCost() {
        UUID userId = UUID.randomUUID();
        when(policyRepository.findById(CreditPolicyKey.AUDITION_APPLY)).thenReturn(Optional.of(policy(true, 9)));
        when(applicationFeeService.currentAmountUsd()).thenReturn(0L);

        creditService.useCredits(userId, CreditPolicyKey.AUDITION_APPLY, "aud-1");

        verify(walletRepository, never()).findByUserIdForUpdate(any());
        verify(txRepository, never()).save(any());
    }

    @Test
    void applyDebitsGlobalFeeNotLegacyPolicyCost() {
        UUID userId = UUID.randomUUID();
        when(policyRepository.findById(CreditPolicyKey.AUDITION_APPLY)).thenReturn(Optional.of(policy(false, 9)));
        when(applicationFeeService.currentAmountUsd()).thenReturn(3L);
        UserCredit wallet = wallet(userId, 10);
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet));

        creditService.useCredits(userId, CreditPolicyKey.AUDITION_APPLY, "aud-1");

        assertEquals(7, wallet.getBalance());
        verify(txRepository, times(1)).save(any());
    }

    @Test
    void insufficientCreditsExposesStructuredShortfall() {
        UUID userId = UUID.randomUUID();
        when(applicationFeeService.currentAmountUsd()).thenReturn(5L);
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet(userId, 2)));

        InsufficientCreditsException ex = assertThrows(
                InsufficientCreditsException.class,
                () -> creditService.useCredits(userId, CreditPolicyKey.AUDITION_APPLY, "aud-1"));
        assertEquals(5, ex.getRequiredCredits());
        assertEquals(2, ex.getCurrentCredits());
        assertEquals(3, ex.getShortfallCredits());
        assertEquals("INSUFFICIENT_CREDITS", InsufficientCreditsException.CODE);
        verify(txRepository, never()).save(any());
    }

    @Test
    void signupRewardIsIdempotent() {
        UUID userId = UUID.randomUUID();
        when(policyRepository.findById(CreditPolicyKey.SIGNUP_CREDIT)).thenReturn(Optional.of(policy(true, 10)));
        when(txRepository.existsByUserIdAndTypeAndReason(userId, CreditTransactionType.GRANT, CreditService.REASON_SIGNUP_REWARD))
                .thenReturn(true);
        when(walletRepository.findById(userId)).thenReturn(Optional.of(wallet(userId, 10)));

        long balance = creditService.grantSignupRewardIfEnabled(userId);
        assertEquals(10, balance);
        verify(txRepository, never()).save(any());
    }

    @Test
    void signupRewardDisabledDoesNotGrant() {
        UUID userId = UUID.randomUUID();
        when(policyRepository.findById(CreditPolicyKey.SIGNUP_CREDIT)).thenReturn(Optional.of(policy(false, 10)));
        when(walletRepository.findById(userId)).thenReturn(Optional.of(wallet(userId, 0)));

        assertEquals(0, creditService.grantSignupRewardIfEnabled(userId));
        verify(txRepository, never()).save(any());
    }

    @Test
    void publicSnapshotUsesGlobalFee() {
        when(policyRepository.findById(CreditPolicyKey.AUDITION_APPLY)).thenReturn(Optional.of(policy(false, 9)));
        when(applicationFeeService.currentAmountUsd()).thenReturn(0L);
        CreditPolicyPublicDto free = creditService.getPolicyPublicSnapshot(CreditPolicyKey.AUDITION_APPLY);
        assertEquals("FREE", free.getApplicationPaymentMode());
        assertEquals(0, free.getApplicationFeeCredits());
        assertEquals(0, free.getApplicationFeeUsd());
        assertFalse(free.isActive());

        when(applicationFeeService.currentAmountUsd()).thenReturn(2L);
        creditService = new CreditService(
                policyRepository,
                walletRepository,
                txRepository,
                new CreditPolicyPublicSnapshotCache(),
                applicationFeeService);
        CreditPolicyPublicDto paid = creditService.getPolicyPublicSnapshot(CreditPolicyKey.AUDITION_APPLY);
        assertEquals("CREDIT", paid.getApplicationPaymentMode());
        assertEquals(2, paid.getApplicationFeeUsd());
        assertEquals(2, paid.getApplicationFeeCredits());
        assertTrue(paid.isActive());
    }

    @Test
    void adminDeductRejectsOverBalance() {
        UUID userId = UUID.randomUUID();
        when(walletRepository.findByUserIdForUpdate(userId)).thenReturn(Optional.of(wallet(userId, 2)));
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> creditService.applyAdminBalanceDelta(userId, -5, UUID.randomUUID(), "사유"));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void applyPaymentModeCreditWhenActiveCostPositive() {
        assertEquals(CreditService.MODE_CREDIT, CreditService.applyPaymentMode(policy(true, 2)));
        assertEquals(CreditService.MODE_FREE, CreditService.applyPaymentMode(policy(true, 0)));
        assertTrue(CreditService.MODE_FREE.equals(CreditService.applyPaymentMode(policy(false, 9))));
    }

    private static CreditPolicy policy(boolean active, long cost) {
        CreditPolicy p = new CreditPolicy();
        p.setPolicyKey(CreditPolicyKey.AUDITION_APPLY);
        p.setActive(active);
        p.setCost(cost);
        return p;
    }

    private static UserCredit wallet(UUID userId, long balance) {
        UserCredit w = new UserCredit();
        w.setUserId(userId);
        w.setBalance(balance);
        return w;
    }
}
