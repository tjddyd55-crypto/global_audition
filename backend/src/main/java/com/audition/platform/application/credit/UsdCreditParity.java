package com.audition.platform.application.credit;

/**
 * 확정된 사업 정책. 1 USD = 1 Credit.
 * 슈퍼 관리자는 전역 정수 USD 지원비 하나만 정한다. 오디션별 가격은 없다.
 * 차감 크레딧 수량 = USD × {@link #CREDITS_PER_USD}.
 * 크레딧 판매가, 세금, 환불 정책, 프로모션, Native IAP 는 이 정책 밖이다.
 * DB CHECK credit_transactions_apply_fee_parity_chk 는 배수 1 을 전제로 한다.
 * 이 상수를 바꾸면 그 CHECK 를 교체하는 새 Flyway 가 필요하다.
 */
public final class UsdCreditParity {

    public static final long CREDITS_PER_USD = 1L;

    private UsdCreditParity() {
    }

    public static long creditsForUsd(long usdMajorUnits) {
        if (usdMajorUnits <= 0) {
            return 0L;
        }
        return Math.multiplyExact(usdMajorUnits, CREDITS_PER_USD);
    }
}
