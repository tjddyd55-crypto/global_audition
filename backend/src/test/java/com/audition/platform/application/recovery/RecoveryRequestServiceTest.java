package com.audition.platform.application.recovery;

import com.audition.platform.api.dto.recovery.CreateRecoveryHelpRequest;
import com.audition.platform.api.dto.recovery.RecoveryRequestDto;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.domain.recovery.RecoveryRequest;
import com.audition.platform.domain.recovery.RecoveryRequestRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RecoveryRequestServiceTest {

    private RecoveryRequestRepository recoveryRequestRepository;
    private AuthRecoveryService authRecoveryService;
    private RecoveryRequestService service;

    @BeforeEach
    void setUp() {
        recoveryRequestRepository = mock(RecoveryRequestRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        authRecoveryService = mock(AuthRecoveryService.class);
        AdminAuditLogService audit = mock(AdminAuditLogService.class);
        service = new RecoveryRequestService(recoveryRequestRepository, userRepository, authRecoveryService, audit);
        when(recoveryRequestRepository.save(any(RecoveryRequest.class))).thenAnswer(inv -> {
            RecoveryRequest row = inv.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            return row;
        });
    }

    @Test
    void createStoresPendingAndOptionalUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        when(authRecoveryService.findOptionalByEmail("lost@example.com")).thenReturn(user);

        CreateRecoveryHelpRequest req = new CreateRecoveryHelpRequest();
        req.setAccountIdentifier("lost@example.com");
        req.setRequesterName("홍길동");
        req.setContact("010-0000-0000");
        req.setMessage("코드를 분실했습니다");

        RecoveryRequestDto dto = service.create(req);
        assertEquals("PENDING", dto.getStatus());
        assertEquals(user.getId(), dto.getUserId());
        assertEquals("lost@example.com", dto.getAccountIdentifier());
    }

    @Test
    void adminListWithoutAuthIsUnauthorized() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.list(null, Pageable.unpaged()));
        assertEquals(401, ex.getStatusCode().value());
    }

    @Test
    void reissueWithoutAuthIsUnauthorized() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.reissue(UUID.randomUUID()));
        assertEquals(401, ex.getStatusCode().value());
    }
}
