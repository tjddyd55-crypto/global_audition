package com.audition.platform.application.org;

/**
 * 정수 USD 메이저 유닛. 비율은 basis point (10000 = 100%).
 * base * bps 가 10000 으로 나누어떨어지지 않고 반올림 정책이 UNDECIDED 이면 지급액을 만들지 않는다.
 * 이름 없는 반올림은 적용하지 않는다.
 */
public final class SettlementMath {

    public static final String NEEDS_CONFIRMATION = "NEEDS_CONFIRMATION";
    public static final String CALCULATED = "CALCULATED";
    public static final String BASIS_CASH_COLLECTED = "CASH_COLLECTED";
    public static final String ROUNDING_UNDECIDED = "UNDECIDED";

    private SettlementMath() {
    }

    public record Result(String status, Long baseUsd, Long compensationUsd, Long hqShareUsd, String note) {
    }

    public static Result compute(
            long targetRevenueUsd,
            long refundsUsd,
            Long paymentFeesUsd,
            Long extraDeductionsUsd,
            Integer rateBps,
            String settlementBasis,
            String roundingPolicy) {
        if (settlementBasis == null || settlementBasis.isBlank()) {
            return blocked("SETTLEMENT_BASIS_UNSET");
        }
        if (!BASIS_CASH_COLLECTED.equals(settlementBasis)) {
            return blocked("BASIS_NOT_OPERATIONAL");
        }
        if (paymentFeesUsd == null || extraDeductionsUsd == null) {
            return blocked("CONTRACTUAL_DEDUCTIONS_UNSET");
        }
        if (rateBps == null) {
            return blocked("RATE_UNSET");
        }
        if (rateBps < 0 || rateBps > 10_000) {
            return blocked("RATE_OUT_OF_RANGE");
        }
        long base = targetRevenueUsd - refundsUsd - paymentFeesUsd - extraDeductionsUsd;
        long product = Math.multiplyExact(base, (long) rateBps);
        if (product % 10_000 != 0) {
            String policy = roundingPolicy == null || roundingPolicy.isBlank()
                    ? ROUNDING_UNDECIDED
                    : roundingPolicy;
            if (ROUNDING_UNDECIDED.equals(policy)) {
                return new Result(NEEDS_CONFIRMATION, base, null, null, "ROUNDING_UNDECIDED");
            }
            return new Result(NEEDS_CONFIRMATION, base, null, null, "ROUNDING_POLICY_UNKNOWN");
        }
        long compensation = product / 10_000;
        long hqShare = base - compensation;
        return new Result(CALCULATED, base, compensation, hqShare, "EXACT");
    }

    private static Result blocked(String note) {
        return new Result(NEEDS_CONFIRMATION, null, null, null, note);
    }
}
