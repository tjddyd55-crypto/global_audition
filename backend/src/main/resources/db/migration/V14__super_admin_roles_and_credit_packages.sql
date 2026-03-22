SET search_path TO public;

-- users.role: SUPER_ADMIN(슈퍼관리), USER(일반 사용자 역할) 추가. 기존 APPLICANT/AGENCY/ADMIN 유지.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('APPLICANT', 'AGENCY', 'ADMIN', 'SUPER_ADMIN', 'USER'));

CREATE TABLE IF NOT EXISTS public.credit_packages (
    id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price BIGINT NOT NULL,
    credits BIGINT NOT NULL,
    bonus_credits BIGINT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON public.credit_packages (active);
