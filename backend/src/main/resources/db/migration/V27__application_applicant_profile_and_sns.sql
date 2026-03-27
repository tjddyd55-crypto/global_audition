SET search_path TO public;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS applicant_name TEXT;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS age INT;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(10);

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS intro_text TEXT;

CREATE TABLE IF NOT EXISTS public.application_sns_links (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  platform VARCHAR(32) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_sns_links_application
  ON public.application_sns_links(application_id);

CREATE INDEX IF NOT EXISTS idx_applications_audition_age
  ON public.applications(audition_id, age);
