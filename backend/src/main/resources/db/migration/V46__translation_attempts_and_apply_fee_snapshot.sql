-- 번역 실패는 기존 번역 행을 바꾸지 않고 시도 이력에 남긴다.
-- 자동 번역 성공 저장은 row_version 으로 compare-and-set 한다.
-- 지원 차감 원장에는 적용된 USD 와 크레딧 수량만 추가한다.
-- 기존 credit_transactions / payment_orders 금액은 UPDATE 하지 않는다.
-- 1 USD = 1 Credit 은 Java UsdCreditParity.CREDITS_PER_USD 가 기준이다.
-- 아래 CHECK 는 그 정책(배수 1)을 새 행에만 강제한다. 정책을 바꾸면 새 마이그레이션으로 CHECK 를 교체한다.
-- V39 의 ux_credit_tx_apply_fee (user_id, reference_id) 중복 차감 방지는 유지한다.

CREATE TABLE IF NOT EXISTS public.audition_translation_attempts (
    id UUID NOT NULL PRIMARY KEY,
    audition_id UUID NOT NULL REFERENCES public.auditions (id) ON DELETE CASCADE,
    locale VARCHAR(8) NOT NULL,
    status TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    provider TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT audition_translation_attempts_status_chk CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_audition_translation_attempts_lookup
    ON public.audition_translation_attempts (audition_id, locale, started_at DESC);

COMMENT ON TABLE public.audition_translation_attempts IS
    'Auto-translation job log. Failure is stored here so audition_translations body, status, and origin stay until a successful auto translation is applied.';
COMMENT ON COLUMN public.audition_translation_attempts.error_code IS
    'MISSING_FIELD, ARRAY_LENGTH_MISMATCH, MALFORMED_JSON, HTTP_ERROR, TIMEOUT, ENDPOINT_REJECTED, NOT_CONFIGURED, PROVIDER_ERROR, or CONCURRENT_EDIT.';

ALTER TABLE public.audition_translations
    ADD COLUMN IF NOT EXISTS row_version BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.audition_translations.row_version IS
    'Optimistic lock incremented on each successful manual or auto write. Auto apply updates only when the version still matches.';

ALTER TABLE public.credit_transactions
    ADD COLUMN IF NOT EXISTS applied_fee_usd BIGINT,
    ADD COLUMN IF NOT EXISTS applied_credit_quantity BIGINT;

ALTER TABLE public.credit_transactions
    DROP CONSTRAINT IF EXISTS credit_transactions_apply_fee_parity_chk;

ALTER TABLE public.credit_transactions
    ADD CONSTRAINT credit_transactions_apply_fee_parity_chk
    CHECK (
        (applied_fee_usd IS NULL AND applied_credit_quantity IS NULL)
        OR (applied_fee_usd >= 0 AND applied_credit_quantity = applied_fee_usd)
    );

COMMENT ON COLUMN public.credit_transactions.applied_fee_usd IS
    'USD major units of the global application fee at deduct time. Null on rows written before V46 and on non-apply transactions. Not backfilled.';
COMMENT ON COLUMN public.credit_transactions.applied_credit_quantity IS
    'Credits deducted for that fee under UsdCreditParity (currently 1 credit per 1 USD). Null when applied_fee_usd is null.';
