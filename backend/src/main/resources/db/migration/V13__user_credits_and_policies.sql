SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.credit_policies (
    policy_key VARCHAR(128) NOT NULL PRIMARY KEY,
    cost BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    reason VARCHAR(128) NOT NULL,
    reference_id VARCHAR(256),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON public.credit_transactions(user_id, created_at DESC);

INSERT INTO public.credit_policies (policy_key, cost, active, updated_at)
VALUES ('AUDITION_APPLY', 1, true, now())
ON CONFLICT (policy_key) DO NOTHING;
