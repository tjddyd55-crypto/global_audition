package com.audition.platform.application.payment;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

/**
 * 플랫폼 정산 통화 SSOT.
 *
 * <p>Toss Payments 공식 문서:
 * <ul>
 *   <li>Checkout {@code amount.value} 는 정수. KRW=원, USD=달러(major unit).</li>
 *   <li>USD 는 {@code FOREIGN_EASY_PAY}(PayPal 등)에서 공식 지원. Stripe 센트(×100)가 아님.</li>
 *   <li>Confirm {@code POST /v1/payments/confirm} 의 {@code amount} 는 checkout value 와 같은 숫자.</li>
 * </ul>
 * 패키지 가격은 정수 달러($1/$5/$10)만 허용해 confirm 정수와 일치시킨다.
 */
public final class SettlementCurrency {

    public static final String CODE = "USD";
    /** Toss 공식 USD 경로. CARD+USD 는 쓰지 않는다. */
    public static final String TOSS_METHOD = "FOREIGN_EASY_PAY";
    public static final String TOSS_EASY_PAY_PROVIDER = "PAYPAL";

    private SettlementCurrency() {
    }

    public static String requireUsd(String raw) {
        if (raw == null || raw.isBlank()) {
            return CODE;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if (!CODE.equals(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "정산 통화는 USD만 허용합니다. 환율 변환은 하지 않습니다.");
        }
        return CODE;
    }

    public static BigDecimal requireWholeUsd(BigDecimal amount) {
        if (amount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금액이 없습니다.");
        }
        BigDecimal scaled;
        try {
            scaled = amount.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Toss USD amount.value 는 정수 달러입니다. $1 / $5 / $10 처럼 소수점 없이 입력하세요.");
        }
        if (scaled.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금액은 0보다 커야 합니다.");
        }
        if (scaled.remainder(BigDecimal.ONE).signum() != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Toss USD amount.value 는 정수 달러입니다. $1 / $5 / $10 처럼 소수점 없이 입력하세요.");
        }
        return scaled.setScale(0, RoundingMode.UNNECESSARY);
    }

    /**
     * Toss checkout/confirm 에 넣는 정수. USD 달러 = KRW 원과 같이 major-unit 정수.
     */
    public static long toTossAmount(BigDecimal amount, String currency) {
        String code = requireUsd(currency == null || currency.isBlank() ? CODE : currency);
        BigDecimal whole = requireWholeUsd(amount);
        if (!CODE.equals(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Toss 정산 통화는 USD입니다.");
        }
        return whole.longValueExact();
    }
}
