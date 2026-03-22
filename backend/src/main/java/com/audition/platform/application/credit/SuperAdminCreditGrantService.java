package com.audition.platform.application.credit;

import com.audition.platform.api.dto.AdminCreditBulkGrantRequest;
import com.audition.platform.api.dto.AdminCreditBulkGrantResponse;
import com.audition.platform.api.dto.AdminCreditGrantRequest;
import com.audition.platform.api.dto.AdminCreditGrantResponse;
import com.audition.platform.api.dto.BulkGrantConditionDto;
import com.audition.platform.application.audit.AdminAuditAction;
import com.audition.platform.application.audit.AdminAuditLogService;
import com.audition.platform.domain.user.User;
import com.audition.platform.domain.user.UserRepository;
import com.audition.platform.domain.user.UserSpecifications;
import com.audition.platform.infra.SecurityUtils;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SuperAdminCreditGrantService {

    private final UserRepository userRepository;
    private final CreditService creditService;
    private final AdminAuditLogService adminAuditLogService;

    public SuperAdminCreditGrantService(
            UserRepository userRepository,
            CreditService creditService,
            AdminAuditLogService adminAuditLogService) {
        this.userRepository = userRepository;
        this.creditService = creditService;
        this.adminAuditLogService = adminAuditLogService;
    }

    public AdminCreditGrantResponse grant(AdminCreditGrantRequest request) {
        SuperAdminAuthHelper.requireSuperAdmin();
        UUID targetId = request.getUserId();
        if (!userRepository.existsById(targetId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다.");
        }
        UUID actor = SecurityUtils.getCurrentUserId();
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String ref = actor.toString();
        long balanceAfter =
                creditService.grantCredits(targetId, request.getAmount(), request.getReason(), ref, actor, request.getNote());
        long balanceBefore = balanceAfter - request.getAmount();
        Map<String, Object> before = Map.of("userId", targetId.toString(), "balance", balanceBefore);
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("userId", targetId.toString());
        after.put("balance", balanceAfter);
        after.put("amount", request.getAmount());
        after.put("reason", request.getReason());
        if (request.getNote() != null && !request.getNote().isBlank()) {
            after.put("note", request.getNote().trim());
        }
        adminAuditLogService.log(actor, AdminAuditAction.CREDIT_GRANT, "USER", targetId.toString(), before, after);
        return new AdminCreditGrantResponse(targetId.toString(), balanceAfter);
    }

    public AdminCreditBulkGrantResponse grantBulk(AdminCreditBulkGrantRequest request) {
        SuperAdminAuthHelper.requireSuperAdmin();
        BulkGrantConditionDto c = request.getCondition();
        if (c == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "condition이 필요합니다.");
        }
        boolean hasCountry = c.getCountry() != null && !c.getCountry().isBlank();
        boolean hasDate = c.getCreatedAfter() != null;
        if (!hasCountry && !hasDate) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "condition.country 또는 condition.createdAfter 중 하나 이상을 지정해야 합니다.");
        }
        CreditGrantLimits.validateAmount(request.getAmount());
        CreditGrantReason.normalize(request.getReason());

        String countryFilter = hasCountry ? c.getCountry().trim() : null;
        Instant createdAfter = hasDate ? c.getCreatedAfter() : null;
        Specification<User> spec = UserSpecifications.forBulkCreditGrant(countryFilter, createdAfter);

        long total = userRepository.count(spec);
        if (total > CreditGrantLimits.MAX_USERS_PER_BULK) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "대상 유저가 너무 많습니다. 최대 " + CreditGrantLimits.MAX_USERS_PER_BULK + "명까지 허용됩니다. (현재 "
                            + total + "명)");
        }
        if (total == 0) {
            return new AdminCreditBulkGrantResponse(0, 0L);
        }

        List<User> users = userRepository.findAll(spec);
        UUID actor = SecurityUtils.getCurrentUserId();
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String bulkRef = "BULK:" + actor + ":" + Instant.now().toEpochMilli();

        int n = 0;
        for (User u : users) {
            creditService.grantCredits(u.getId(), request.getAmount(), request.getReason(), bulkRef, actor, request.getNote());
            n++;
        }
        long totalCredits = (long) n * request.getAmount();

        Map<String, Object> cond = new LinkedHashMap<>();
        if (countryFilter != null) {
            cond.put("country", countryFilter);
        }
        if (createdAfter != null) {
            cond.put("createdAfter", createdAfter.toString());
        }
        Map<String, Object> after = new LinkedHashMap<>();
        after.put("affectedUsers", n);
        after.put("totalCreditsGranted", totalCredits);
        after.put("amountPerUser", request.getAmount());
        after.put("reason", request.getReason());
        after.put("condition", cond);
        after.put("bulkReferenceId", bulkRef);
        if (request.getNote() != null && !request.getNote().isBlank()) {
            after.put("note", request.getNote().trim());
        }
        adminAuditLogService.log(actor, AdminAuditAction.CREDIT_GRANT_BULK, "CREDIT_BULK", bulkRef, Map.of(), after);

        return new AdminCreditBulkGrantResponse(n, totalCredits);
    }
}
