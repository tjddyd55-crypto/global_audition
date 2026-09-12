SET search_path TO public;

-- 가입 보상 정책. cost=지급 크레딧, active=지급 여부. 기본 OFF.
INSERT INTO public.credit_policies (policy_key, cost, active, updated_at)
VALUES ('SIGNUP_CREDIT', 0, false, now())
ON CONFLICT (policy_key) DO NOTHING;

-- 가입 보상 1회, 지원 차감 1회/오디션, 패키지 충전 1회/주문
CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_tx_signup_reward
    ON public.credit_transactions (user_id)
    WHERE type = 'GRANT' AND reason = 'SIGNUP_REWARD';

CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_tx_apply_fee
    ON public.credit_transactions (user_id, reference_id)
    WHERE type = 'USE' AND reason = 'AUDITION_APPLY' AND reference_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_tx_package_purchase
    ON public.credit_transactions (user_id, reference_id)
    WHERE type = 'CHARGE' AND reason = 'PACKAGE_PURCHASE' AND reference_id IS NOT NULL;
