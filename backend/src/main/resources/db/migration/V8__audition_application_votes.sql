SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.audition_application_votes (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_aav_audition_voter UNIQUE (audition_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_aav_audition ON public.audition_application_votes(audition_id);
CREATE INDEX IF NOT EXISTS idx_aav_application ON public.audition_application_votes(application_id);
CREATE INDEX IF NOT EXISTS idx_aav_voter ON public.audition_application_votes(voter_id);
