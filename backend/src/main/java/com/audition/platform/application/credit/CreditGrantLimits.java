package com.audition.platform.application.credit;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * 슈퍼관리자 지급 API 공통 한도.
 */
public final class CreditGrantLimits {

    public static final long MAX_AMOUNT_PER_OPERATION = 10_000L;
    /** 대량 지급 시 한 번에 처리 가능한 최대 인원 (과부하 방지) */
    public static final int MAX_USERS_PER_BULK = 5_000;

    private CreditGrantLimits() {
    }

    public static void validateAmount(long amount) {
        if (amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지급 금액은 1 이상이어야 합니다.");
        }
        if (amount > MAX_AMOUNT_PER_OPERATION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "지급 금액은 " + MAX_AMOUNT_PER_OPERATION + "을(를) 초과할 수 없습니다.");
        }
    }
}
