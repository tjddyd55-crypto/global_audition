SET search_path TO public;

ALTER TABLE public.credit_transactions
    ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS note TEXT,
    ADD COLUMN IF NOT EXISTS before_balance BIGINT,
    ADD COLUMN IF NOT EXISTS after_balance BIGINT;

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(256),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created ON public.admin_logs (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_created ON public.admin_logs (action, created_at DESC);
