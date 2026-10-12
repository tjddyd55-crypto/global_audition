SET search_path TO public;

-- 복구 보안 코드: 평문은 발급 응답에 한 번만. DB에는 lookup(HMAC) + bcrypt hash.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT,
    ADD COLUMN IF NOT EXISTS recovery_code_lookup TEXT,
    ADD COLUMN IF NOT EXISTS recovery_code_issued_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS recovery_failed_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recovery_locked_until TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_recovery_code_lookup
    ON public.users (recovery_code_lookup)
    WHERE recovery_code_lookup IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.recovery_requests (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
    account_identifier TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recovery_requests_status_chk CHECK (status IN ('PENDING', 'RESOLVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_recovery_requests_status_created
    ON public.recovery_requests (status, created_at DESC);
