package com.audition.platform.application.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

/**
 * 통화 최소 단위 정수. 부동소수점 연산을 쓰지 않는다.
 * USD scale 2, KRW scale 0, JPY scale 0.
 */
public final class MoneyMinor {

    private MoneyMinor() {
    }

    public static int scale(String currency) {
        if (currency == null) {
            throw new IllegalArgumentException("CURRENCY_REQUIRED");
        }
        return switch (currency.trim().toUpperCase(Locale.ROOT)) {
            case "USD" -> 2;
            case "KRW", "JPY" -> 0;
            default -> throw new IllegalArgumentException("CURRENCY_SCALE_UNKNOWN");
        };
    }

    public static long chargeMinor(long credits, BigDecimal ratePerCredit, String currency, String rounding) {
        if (credits < 1) {
            throw new IllegalArgumentException("CREDITS_INVALID");
        }
        if (ratePerCredit == null || ratePerCredit.signum() <= 0) {
            throw new IllegalArgumentException("RATE_INVALID");
        }
        int scale = scale(currency);
        RoundingMode mode = roundingMode(rounding);
        BigDecimal units = ratePerCredit.multiply(BigDecimal.valueOf(credits));
        BigDecimal rounded = units.setScale(scale, mode);
        if (scale == 0) {
            return rounded.longValueExact();
        }
        return rounded.movePointRight(scale).longValueExact();
    }

    public static long creditsForRefund(long chargeMinor, long creditsIssued, long refundMinor) {
        if (chargeMinor < 1 || creditsIssued < 1) {
            throw new IllegalArgumentException("ORDER_AMOUNT_INVALID");
        }
        if (refundMinor < 1 || refundMinor > chargeMinor) {
            throw new IllegalArgumentException("REFUND_AMOUNT_INVALID");
        }
        if (Math.multiplyExact(refundMinor, creditsIssued) % chargeMinor != 0) {
            throw new IllegalArgumentException("AMOUNT_MISMATCH");
        }
        return Math.multiplyExact(refundMinor, creditsIssued) / chargeMinor;
    }

    private static RoundingMode roundingMode(String rounding) {
        if (rounding == null) {
            throw new IllegalArgumentException("ROUNDING_REQUIRED");
        }
        return switch (rounding.trim().toUpperCase(Locale.ROOT)) {
            case "HALF_UP" -> RoundingMode.HALF_UP;
            case "DOWN" -> RoundingMode.DOWN;
            default -> throw new IllegalArgumentException("ROUNDING_UNKNOWN");
        };
    }
}
