package com.audition.platform.application.recovery;

import com.audition.platform.api.dto.recovery.CreateRecoveryHelpRequest;
import com.audition.platform.api.dto.recovery.RecoveryCodeIssueResponse;
import com.audition.platform.api.dto.recovery.RecoveryRequestDto;
import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.application.credit.SuperAdminAuthHelper;
import com.audition.platform.domain.recovery.RecoveryRequest;
import com.audition.platform.domain.recovery.RecoveryRequestRepository;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class RecoveryRequestService {

    private final RecoveryRequestRepository recoveryRequestRepository;
    private final UserRepository userRepository;
    private final AuthRecoveryService authRecoveryService;
    private final AdminAuditLogService adminAuditLogService;

    public RecoveryRequestService(
            RecoveryRequestRepository recoveryRequestRepository,
            UserRepository userRepository,
            AuthRecoveryService authRecoveryService,
            AdminAuditLogService adminAuditLogService) {
        this.recoveryRequestRepository = recoveryRequestRepository;
        this.userRepository = userRepository;
        this.authRecoveryService = authRecoveryService;
        this.adminAuditLogService = adminAuditLogService;
    }

    @Transactional
    public RecoveryRequestDto create(CreateRecoveryHelpRequest req) {
        RecoveryRequest row = new RecoveryRequest();
        String identifier = req.getAccountIdentifier().trim();
        row.setAccountIdentifier(identifier);
        row.setRequesterName(req.getRequesterName().trim());
        row.setContact(req.getContact().trim());
        row.setMessage(req.getMessage() != null ? req.getMessage().trim() : null);
        row.setStatus("PENDING");
        UUID current = SecurityUtils.getCurrentUserId();
        if (current != null) {
            row.setUserId(current);
        } else {
            User matched = authRecoveryService.findOptionalByEmail(identifier.toLowerCase(Locale.ROOT));
            if (matched != null) {
                row.setUserId(matched.getId());
            }
        }
        row.setCreatedAt(Instant.now());
        row.setUpdatedAt(Instant.now());
        return toDto(recoveryRequestRepository.save(row));
    }

    @Transactional(readOnly = true)
    public Page<RecoveryRequestDto> list(String status, Pageable pageable) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (status != null && !status.isBlank()) {
            return recoveryRequestRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase(Locale.ROOT), pageable)
                    .map(RecoveryRequestService::toDto);
        }
        return recoveryRequestRepository.findAll(pageable).map(RecoveryRequestService::toDto);
    }

    @Transactional
    public RecoveryCodeIssueResponse reissue(UUID requestId) {
        SuperAdminAuthHelper.requireSuperAdmin();
        RecoveryRequest row = requirePending(requestId);
        User user = resolveUser(row);
        String code = authRecoveryService.issueNewCode(user);
        markReviewed(row, "RESOLVED");
        UUID adminId = SecurityUtils.getCurrentUserId();
        adminAuditLogService.log(
                adminId,
                AdminAuditAction.RECOVERY_REISSUE,
                "RECOVERY_REQUEST",
                row.getId().toString(),
                Map.of("status", "PENDING"),
                Map.of("status", "RESOLVED", "userId", user.getId().toString())
        );
        return new RecoveryCodeIssueResponse(code, user.getEmail());
    }

    @Transactional
    public RecoveryRequestDto reject(UUID requestId) {
        SuperAdminAuthHelper.requireSuperAdmin();
        RecoveryRequest row = requirePending(requestId);
        markReviewed(row, "REJECTED");
        adminAuditLogService.log(
                SecurityUtils.getCurrentUserId(),
                AdminAuditAction.RECOVERY_REJECT,
                "RECOVERY_REQUEST",
                row.getId().toString(),
                Map.of("status", "PENDING"),
                Map.of("status", "REJECTED")
        );
        return toDto(row);
    }

    private RecoveryRequest requirePending(UUID requestId) {
        RecoveryRequest row = recoveryRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "복구 요청을 찾을 수 없습니다."));
        if (!"PENDING".equals(row.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 요청입니다.");
        }
        return row;
    }

    private User resolveUser(RecoveryRequest row) {
        if (row.getUserId() != null) {
            return userRepository.findById(row.getUserId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "연결된 사용자를 찾을 수 없습니다."));
        }
        User byEmail = authRecoveryService.findOptionalByEmail(row.getAccountIdentifier());
        if (byEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "계정 식별자로 사용자를 찾을 수 없습니다.");
        }
        row.setUserId(byEmail.getId());
        return byEmail;
    }

    private void markReviewed(RecoveryRequest row, String status) {
        row.setStatus(status);
        row.setReviewedBy(SecurityUtils.getCurrentUserId());
        row.setReviewedAt(Instant.now());
        row.setUpdatedAt(Instant.now());
        recoveryRequestRepository.save(row);
    }

    private static RecoveryRequestDto toDto(RecoveryRequest row) {
        RecoveryRequestDto dto = new RecoveryRequestDto();
        dto.setId(row.getId());
        dto.setUserId(row.getUserId());
        dto.setAccountIdentifier(row.getAccountIdentifier());
        dto.setRequesterName(row.getRequesterName());
        dto.setContact(row.getContact());
        dto.setMessage(row.getMessage());
        dto.setStatus(row.getStatus());
        dto.setReviewedBy(row.getReviewedBy());
        dto.setReviewedAt(row.getReviewedAt());
        dto.setCreatedAt(row.getCreatedAt());
        dto.setUpdatedAt(row.getUpdatedAt());
        return dto;
    }
}
