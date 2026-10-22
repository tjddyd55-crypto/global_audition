-- 확정된 소비 순서: 무료 크레딧을 먼저 쓰고, 남은 수량만 유료 로트에서 쓴다.
-- 한 사용이 여러 로트로 나뉠 수 있다. 기존 payment_orders / credit_transactions 는 수정하지 않는다.
-- 무료·유료를 신뢰할 수 있게 재구성하지 못하는 사용은 REVIEW_REQUIRED 로 남기고 추정 지급액을 만들지 않는다.

DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'credit_lot_allocations'
          AND con.contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE public.credit_lot_allocations DROP CONSTRAINT %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE public.credit_lot_allocations DROP CONSTRAINT IF EXISTS credit_lot_allocations_status_chk;
ALTER TABLE public.credit_lot_allocations
    ADD CONSTRAINT credit_lot_allocations_status_chk
        CHECK (status IN ('ALLOCATED', 'ALLOCATION_POLICY_PENDING', 'REVIEW_REQUIRED'));

CREATE INDEX IF NOT EXISTS idx_credit_lot_allocations_usage
    ON public.credit_lot_allocations (usage_credit_transaction_id);

UPDATE public.settlement_policies
SET allocation_policy = 'FREE_FIRST',
    updated_at = NOW()
WHERE id = 1;

COMMENT ON TABLE public.settlement_policies IS
    'FREE_FIRST spends free lots before paid lots. Uses that cannot be reconstructed stay REVIEW_REQUIRED and are excluded from compensation.';

ALTER TABLE public.crm_activities
    ADD COLUMN IF NOT EXISTS follow_up_on DATE;

COMMENT ON COLUMN public.crm_activities.follow_up_on IS
    'Optional next consult date. Null when the log has no follow-up.';

CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
    user_id UUID PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    locale TEXT NOT NULL DEFAULT 'ko',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_notification_prefs_locale_chk CHECK (locale IN ('ko', 'ja', 'en'))
);

COMMENT ON TABLE public.user_notification_prefs IS
    'Account notification and UI locale extension. ko is the shipped admin catalog; ja and en use the same keys.';
