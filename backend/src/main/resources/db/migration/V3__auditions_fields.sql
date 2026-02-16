SET search_path TO public;

ALTER TABLE IF EXISTS public.auditions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.auditions
  ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE IF EXISTS public.auditions
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.auditions
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_auditions_owner ON public.auditions(owner_id);
