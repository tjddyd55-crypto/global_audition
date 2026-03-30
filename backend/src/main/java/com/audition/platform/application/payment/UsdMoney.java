package com.audition.platform.application.payment;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * USD 금액(달러 단위, 소수)과 Stripe smallest unit(센트) 변환.
 */
public final class UsdMoney {

    private UsdMoney() {}

    public static long toStripeCents(BigDecimal usd) {
        if (usd == null) {
            return 0L;
        }
        return usd.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
    }
}
