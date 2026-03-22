package com.audition.platform.application.credit;

import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.api.dto.AdminCreditAdjustRequest;
import com.audition.platform.api.dto.AdminCreditAdjustResponse;
import com.audition.platform.api.dto.CreditTransactionDto;
import com.audition.platform.api.dto.UserCreditLookupDto;
import com.audition.platform.domain.credit.CreditTransaction;
import com.audition.platform.domain.credit.CreditTransactionRepository;
import com.audition.platform.domain.credit.CreditTransactionSpecifications;
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
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class SuperAdminCreditAdministrationService {

    private final UserRepository userRepository;
    private final CreditService creditService;
    private final CreditTransactionRepository creditTransactionRepository;
    private final AdminAuditLogService adminAuditLogService;

    public SuperAdminCreditAdministrationService(
            UserRepository userRepository,
            CreditService creditService,
            CreditTransactionRepository creditTransactionRepository,
            AdminAuditLogService adminAuditLogService) {
        this.userRepository = userRepository;
        this.creditService = creditService;
        this.creditTransactionRepository = creditTransactionRepository;
        this.adminAuditLogService = adminAuditLogService;
    }

    @Transactional(readOnly = true)
    public UserCreditLookupDto lookupUser(String q) {
        SuperAdminAuthHelper.requireSuperAdmin();
        if (q == null || q.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색어(q)가 필요합니다.");
        }
        String s = q.trim();
        User user;
        if (s.contains("@")) {
            String email = s.toLowerCase(Locale.ROOT);
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        } else {
            UUID id;
            try {
                id = UUID.fromString(s);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효한 UUID 또는 이메일을 입력하세요.");
            }
            user = userRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        }
        long balance = creditService.getBalance(user.getId());
        return new UserCreditLookupDto(user.getId().toString(), user.getEmail(), balance);
    }

    @Transactional
    public AdminCreditAdjustResponse adjust(AdminCreditAdjustRequest request) {
        SuperAdminAuthHelper.requireSuperAdmin();
        UUID targetId = resolveTargetUserId(request);
        UUID actor = SecurityUtils.getCurrentUserId();
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        long balanceAfter = creditService.applyAdminBalanceDelta(targetId, request.getAmount(), actor, request.getNote());
        long balanceBefore = balanceAfter - request.getAmount();
        Map<String, Object> before = new LinkedHashMap<>();
        before.put("userId", targetId.toString());
        before.put("balance", balanceBefore);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("userId", targetId.toString());
        after.put("balance", balanceAfter);
        after.put("delta", request.getAmount());
        if (request.getNote() != null && !request.getNote().isBlank()) {
            after.put("note", request.getNote().trim());
        }
        adminAuditLogService.log(actor, AdminAuditAction.CREDIT_ADJUST, "USER", targetId.toString(), before, after);
        return new AdminCreditAdjustResponse(targetId.toString(), balanceAfter);
    }

    private UUID resolveTargetUserId(AdminCreditAdjustRequest request) {
        if (request.getUserId() != null) {
            if (!userRepository.existsById(request.getUserId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
            }
            return request.getUserId();
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            User u = userRepository.findByEmail(request.getEmail().trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
            return u.getId();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId 또는 email이 필요합니다.");
    }

    @Transactional(readOnly = true)
    public Page<CreditTransactionDto> listTransactions(
            UUID userId,
            String type,
            Instant fromInclusive,
            Instant toExclusive,
            Pageable pageable) {
        SuperAdminAuthHelper.requireSuperAdmin();
        return creditTransactionRepository
                .findAll(CreditTransactionSpecifications.filter(userId, type, fromInclusive, toExclusive), pageable)
                .map(SuperAdminCreditAdministrationService::toTxDto);
    }

    private static CreditTransactionDto toTxDto(CreditTransaction t) {
        CreditTransactionDto d = new CreditTransactionDto();
        d.setId(t.getId().toString());
        d.setUserId(t.getUserId().toString());
        d.setAmount(t.getAmount());
        d.setType(t.getType());
        d.setReason(t.getReason());
        d.setReferenceId(t.getReferenceId());
        d.setGrantedBy(t.getGrantedBy() != null ? t.getGrantedBy().toString() : null);
        d.setNote(t.getNote());
        d.setBeforeBalance(t.getBeforeBalance());
        d.setAfterBalance(t.getAfterBalance());
        d.setCreatedAt(t.getCreatedAt());
        return d;
    }
}
