-- 전 오디션 공통 지원비. 정수 USD major unit. 기존 주문·원장 금액은 바꾸지 않는다.
-- 초기값은 당시 AUDITION_APPLY 의 유효 비용(활성+양수)이며, 아니면 0(FREE)이다.

CREATE TABLE IF NOT EXISTS public.platform_application_fee (
    id SMALLINT NOT NULL PRIMARY KEY DEFAULT 1,
    amount_usd BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT platform_application_fee_singleton CHECK (id = 1),
    CONSTRAINT platform_application_fee_usd_chk CHECK (amount_usd >= 0 AND amount_usd <= 10000)
);

COMMENT ON TABLE public.platform_application_fee IS
    'Single global audition application fee in whole USD dollars. Client must not send the amount.';
COMMENT ON COLUMN public.platform_application_fee.amount_usd IS
    'Integer USD major unit charged at apply time. 0 means FREE. Not cents.';

CREATE TABLE IF NOT EXISTS public.platform_application_fee_history (
    id UUID NOT NULL PRIMARY KEY,
    old_amount_usd BIGINT NOT NULL,
    new_amount_usd BIGINT NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    CONSTRAINT platform_application_fee_history_usd_chk CHECK (old_amount_usd >= 0 AND new_amount_usd >= 0)
);

COMMENT ON TABLE public.platform_application_fee_history IS
    'Who changed the global application fee, when, and the old and new integer USD amounts.';

INSERT INTO public.platform_application_fee (id, amount_usd)
SELECT 1,
       CASE
           WHEN p.active AND p.cost > 0 THEN LEAST(p.cost, 10000)
           ELSE 0
       END
FROM public.credit_policies p
WHERE p.policy_key = 'AUDITION_APPLY'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.platform_application_fee (id, amount_usd)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;
