package com.audition.platform.application.fee;

import com.audition.platform.api.dto.ApplicationFeeView;
import com.audition.platform.application.credit.CreditPolicyKey;
import com.audition.platform.application.credit.CreditPolicyPublicSnapshotCache;
import com.audition.platform.domain.credit.CreditPolicy;
import com.audition.platform.domain.credit.CreditPolicyRepository;
import com.audition.platform.domain.fee.PlatformApplicationFee;
import com.audition.platform.domain.fee.PlatformApplicationFeeHistory;
import com.audition.platform.domain.fee.PlatformApplicationFeeHistoryRepository;
import com.audition.platform.domain.fee.PlatformApplicationFeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GlobalApplicationFeeServiceTest {

    private PlatformApplicationFeeRepository feeRepository;
    private PlatformApplicationFeeHistoryRepository historyRepository;
    private CreditPolicyRepository policyRepository;
    private GlobalApplicationFeeService service;
    private PlatformApplicationFee row;

    @BeforeEach
    void setUp() {
        feeRepository = mock(PlatformApplicationFeeRepository.class);
        historyRepository = mock(PlatformApplicationFeeHistoryRepository.class);
        policyRepository = mock(CreditPolicyRepository.class);
        service = new GlobalApplicationFeeService(
                feeRepository,
                historyRepository,
                policyRepository,
                new CreditPolicyPublicSnapshotCache());
        row = new PlatformApplicationFee();
        row.setId(PlatformApplicationFee.SINGLETON_ID);
        row.setAmountUsd(1);
        when(feeRepository.findById(PlatformApplicationFee.SINGLETON_ID)).thenReturn(Optional.of(row));
        when(feeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(policyRepository.findById(CreditPolicyKey.AUDITION_APPLY)).thenReturn(Optional.of(policy()));
        when(policyRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                UUID.randomUUID(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"))));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsFractionalUsd() {
        assertThrows(ResponseStatusException.class, () -> service.update(new BigDecimal("1.5")));
        verify(historyRepository, never()).save(any());
        assertEquals(1, row.getAmountUsd());
    }

    @Test
    void recordsWhoWhenOldAndNew() {
        ApplicationFeeView view = service.update(new BigDecimal("3"));

        assertEquals(3, view.getAmountUsd());
        assertEquals(3, row.getAmountUsd());
        verify(historyRepository).save(any(PlatformApplicationFeeHistory.class));
    }

    @Test
    void sameAmountDoesNotAppendHistory() {
        service.update(new BigDecimal("1"));
        verify(historyRepository, never()).save(any());
    }

    @Test
    void inactivePolicyPatchStoresZero() {
        ApplicationFeeView view = service.replaceFromCreditPolicy(9, false, UUID.randomUUID());
        assertEquals(0, view.getAmountUsd());
    }

    private static CreditPolicy policy() {
        CreditPolicy policy = new CreditPolicy();
        policy.setPolicyKey(CreditPolicyKey.AUDITION_APPLY);
        policy.setCost(1);
        policy.setActive(true);
        return policy;
    }
}
