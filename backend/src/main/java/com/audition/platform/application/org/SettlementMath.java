package com.audition.platform.application.org;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 정산 통화는 USD 다. 원천 거래를 각각 반올림하지 않고 합계에 요율을 한 번 적용한 뒤
 * scale 2, HALF_UP 으로 확정한다. double 은 쓰지 않는다.
 * 지원 수수료와 결제 금액의 정수 USD 모델은 여기서 바꾸지 않는다.
 */
public final class SettlementMath {

    public static final String NEEDS_CONFIRMATION = "NEEDS_CONFIRMATION";
    public static final String CALCULATED = "CALCULATED";
    public static final String ALLOCATION_POLICY_PENDING = "ALLOCATION_POLICY_PENDING";
    public static final String REFUND_ALLOCATION_PENDING = "REFUND_ALLOCATION_PENDING";
    public static final String BASIS_PAID_USAGE = "PAID_USAGE_LINKED_TO_CASH";
    public static final String ROUNDING_HALF_UP = "HALF_UP";
    public static final String REFUND_DEDUCT = "DEDUCT_LINKED_REFUNDS";
    public static final String DEDUCTION_NONE = "NONE";
    public static final String DEDUCTION_FIXED = "FIXED_USD";
    public static final int MONEY_SCALE = 2;
    public static final int RAW_SCALE = 4;

    private SettlementMath() {
    }

    public record Figure(BigDecimal raw, BigDecimal settled, BigDecimal difference) {
    }

    public record Terms(
            Integer rateBps,
            String basis,
            String roundingPolicy,
            String refundBasis,
            String paymentFeeBasis,
            Long paymentFeeUsd,
            String extraBasis,
            Long extraDeductionUsd) {
    }

    public record Result(String status, Figure base, Figure compensation, Figure hq, String note) {
    }

    public static Result compute(Terms terms, BigDecimal targetUsd, BigDecimal refundsUsd) {
        if (terms == null || terms.basis() == null || terms.basis().isBlank()) {
            return blocked("SETTLEMENT_BASIS_UNSET");
        }
        if (!BASIS_PAID_USAGE.equals(terms.basis())) {
            return blocked("BASIS_NOT_OPERATIONAL");
        }
        if (terms.rateBps() == null) {
            return blocked("RATE_UNSET");
        }
        if (terms.rateBps() < 0 || terms.rateBps() > 10_000) {
            return blocked("RATE_OUT_OF_RANGE");
        }
        if (!ROUNDING_HALF_UP.equals(terms.roundingPolicy())) {
            return blocked("ROUNDING_POLICY_UNCONFIRMED");
        }
        if (terms.refundBasis() == null || terms.refundBasis().isBlank()) {
            return blocked("REFUND_DEDUCTION_BASIS_UNSET");
        }
        BigDecimal fee = deduction(terms.paymentFeeBasis(), terms.paymentFeeUsd());
        if (fee == null) {
            return blocked("PAYMENT_FEE_DEDUCTION_BASIS_UNSET");
        }
        BigDecimal extra = deduction(terms.extraBasis(), terms.extraDeductionUsd());
        if (extra == null) {
            return blocked("EXTRA_DEDUCTION_BASIS_UNSET");
        }
        if (!REFUND_DEDUCT.equals(terms.refundBasis()) && !DEDUCTION_NONE.equals(terms.refundBasis())) {
            return blocked("REFUND_DEDUCTION_BASIS_UNKNOWN");
        }
        BigDecimal target = money(targetUsd);
        BigDecimal refunds = REFUND_DEDUCT.equals(terms.refundBasis()) ? money(refundsUsd) : BigDecimal.ZERO;
        BigDecimal baseRaw = target.subtract(refunds).subtract(fee).subtract(extra);
        if (baseRaw.signum() < 0) {
            return blocked("NEGATIVE_BASE");
        }
        BigDecimal compensationRaw = baseRaw
                .multiply(BigDecimal.valueOf(terms.rateBps().longValue()))
                .divide(BigDecimal.valueOf(10_000), RAW_SCALE, RoundingMode.UNNECESSARY);
        Figure base = figure(baseRaw);
        Figure compensation = figure(compensationRaw);
        BigDecimal hqRaw = baseRaw.subtract(compensationRaw);
        BigDecimal hqSettled = base.settled().subtract(compensation.settled());
        Figure hq = new Figure(hqRaw, hqSettled, hqSettled.subtract(hqRaw));
        return new Result(CALCULATED, base, compensation, hq, "HALF_UP_AGGREGATE");
    }

    public static Long wholeDollars(BigDecimal settled) {
        if (settled == null) {
            return null;
        }
        BigDecimal stripped = settled.stripTrailingZeros();
        if (stripped.scale() > 0) {
            return null;
        }
        return stripped.longValueExact();
    }

    private static BigDecimal deduction(String basis, Long amount) {
        if (basis == null || basis.isBlank()) {
            return null;
        }
        if (DEDUCTION_NONE.equals(basis)) {
            if (amount != null && amount != 0L) {
                return null;
            }
            return BigDecimal.ZERO;
        }
        if (DEDUCTION_FIXED.equals(basis)) {
            if (amount == null || amount < 0) {
                return null;
            }
            return BigDecimal.valueOf(amount);
        }
        return null;
    }

    private static BigDecimal money(BigDecimal value) {
        BigDecimal exact = value == null ? BigDecimal.ZERO : value;
        return exact.setScale(0, RoundingMode.UNNECESSARY);
    }

    private static Figure figure(BigDecimal raw) {
        BigDecimal settled = raw.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        return new Figure(raw, settled, settled.subtract(raw));
    }

    private static Result blocked(String note) {
        return new Result(NEEDS_CONFIRMATION, null, null, null, note);
    }
}
