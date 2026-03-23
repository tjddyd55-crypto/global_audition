SET search_path TO public;

ALTER TABLE public.credit_packages
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.credit_packages (id) ON DELETE RESTRICT,
    provider VARCHAR(32) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'KRW',
    status VARCHAR(24) NOT NULL,
    credits BIGINT NOT NULL,
    bonus_credits BIGINT NOT NULL,
    paid_at TIMESTAMPTZ,
    provider_tx_id VARCHAR(256),
    fail_reason TEXT,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created ON public.payment_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders (status);
