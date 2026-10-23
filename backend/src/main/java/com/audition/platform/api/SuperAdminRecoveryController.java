package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.recovery.RecoveryCodeIssueResponse;
import com.audition.platform.api.dto.recovery.RecoveryRequestDto;
import com.audition.platform.application.recovery.RecoveryRequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/recovery-requests")
public class SuperAdminRecoveryController {

    private final RecoveryRequestService recoveryRequestService;

    public SuperAdminRecoveryController(RecoveryRequestService recoveryRequestService) {
        this.recoveryRequestService = recoveryRequestService;
    }

    @GetMapping
    public Page<RecoveryRequestDto> list(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return recoveryRequestService.list(status, pageable);
    }

    @PostMapping("/{id}/reissue")
    public ApiEnvelope<RecoveryCodeIssueResponse> reissue(@PathVariable UUID id) {
        return ApiEnvelope.ok(recoveryRequestService.reissue(id));
    }

    @PostMapping("/{id}/reject")
    public ApiEnvelope<RecoveryRequestDto> reject(@PathVariable UUID id) {
        return ApiEnvelope.ok(recoveryRequestService.reject(id));
    }
}
