SET search_path TO public;

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.applications
  ADD COLUMN IF NOT EXISTS message TEXT;

CREATE TABLE IF NOT EXISTS public.application_videos (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applications_audition ON public.applications(audition_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_application_videos_application ON public.application_videos(application_id);
