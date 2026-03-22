package com.audition.platform.application.credit;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

/**
 * {@code credit_transactions.reason} — GRANT 유형 지급 시 허용 값.
 */
public final class CreditGrantReason {

    public static final String ADMIN_GRANT = "ADMIN_GRANT";
    public static final String EVENT_REWARD = "EVENT_REWARD";
    public static final String PROMOTION = "PROMOTION";

    private static final Set<String> ALLOWED = Set.of(ADMIN_GRANT, EVENT_REWARD, PROMOTION);

    private CreditGrantReason() {
    }

    public static void validate(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason이 필요합니다.");
        }
        String normalized = reason.trim();
        if (!ALLOWED.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "reason은 ADMIN_GRANT, EVENT_REWARD, PROMOTION 중 하나여야 합니다.");
        }
    }

    public static String normalize(String reason) {
        validate(reason);
        return reason.trim();
    }
}
