package com.audition.platform.api;

import com.audition.platform.api.dto.CreditBalanceResponse;
import com.audition.platform.api.dto.CreditChargeRequest;
import com.audition.platform.application.credit.CreditService;
import com.audition.platform.infra.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/credits")
public class CreditController {

    private final CreditService creditService;

    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }

    @GetMapping("/balance")
    public CreditBalanceResponse getBalance() {
        UUID userId = requireUserId();
        return new CreditBalanceResponse(creditService.getBalance(userId));
    }

    @PostMapping("/charge")
    public CreditBalanceResponse charge(@Valid @RequestBody CreditChargeRequest request) {
        UUID userId = requireUserId();
        long balance = creditService.chargeCredits(userId, request.getAmount());
        return new CreditBalanceResponse(balance);
    }

    private static UUID requireUserId() {
        UUID userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return userId;
    }
}
