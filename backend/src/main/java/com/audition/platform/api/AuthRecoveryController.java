package com.audition.platform.api;

import com.audition.platform.api.dto.ApiEnvelope;
import com.audition.platform.api.dto.recovery.CreateRecoveryHelpRequest;
import com.audition.platform.api.dto.recovery.RecoverIdentifyRequest;
import com.audition.platform.api.dto.recovery.RecoverIdentifyResponse;
import com.audition.platform.api.dto.recovery.RecoverResetRequest;
import com.audition.platform.api.dto.recovery.RecoveryRequestDto;
import com.audition.platform.application.recovery.AuthRecoveryService;
import com.audition.platform.application.recovery.RecoveryRateLimiter;
import com.audition.platform.application.recovery.RecoveryRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthRecoveryController {

    private final AuthRecoveryService authRecoveryService;
    private final RecoveryRequestService recoveryRequestService;
    private final RecoveryRateLimiter recoveryRateLimiter;

    public AuthRecoveryController(
            AuthRecoveryService authRecoveryService,
            RecoveryRequestService recoveryRequestService,
            RecoveryRateLimiter recoveryRateLimiter) {
        this.authRecoveryService = authRecoveryService;
        this.recoveryRequestService = recoveryRequestService;
        this.recoveryRateLimiter = recoveryRateLimiter;
    }

    @PostMapping("/recover/identify")
    public ApiEnvelope<RecoverIdentifyResponse> identify(
            @Valid @RequestBody RecoverIdentifyRequest request,
            HttpServletRequest http) {
        recoveryRateLimiter.checkIdentify(clientKey(http));
        return ApiEnvelope.ok(authRecoveryService.identify(request.getRecoveryCode()));
    }

    @PostMapping("/recover/reset")
    public ApiEnvelope<Boolean> reset(
            @Valid @RequestBody RecoverResetRequest request,
            HttpServletRequest http) {
        recoveryRateLimiter.checkReset(clientKey(http));
        authRecoveryService.resetPassword(request.getRecoveryCode(), request.getNewPassword());
        return ApiEnvelope.ok(true);
    }

    @PostMapping("/recovery-requests")
    public ApiEnvelope<RecoveryRequestDto> createHelpRequest(
            @Valid @RequestBody CreateRecoveryHelpRequest request,
            HttpServletRequest http) {
        recoveryRateLimiter.checkRequest(clientKey(http));
        return ApiEnvelope.ok(recoveryRequestService.create(request));
    }

    private static String clientKey(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr() != null ? http.getRemoteAddr() : "unknown";
    }
}
