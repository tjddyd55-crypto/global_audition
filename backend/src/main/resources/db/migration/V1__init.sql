SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('APPLICANT','AGENCY','ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.auditions (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','OPEN','CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL CHECK (status IN ('SUBMITTED','REVIEWED','ACCEPTED','REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (audition_id, applicant_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_auditions_owner ON public.auditions(owner_id);
CREATE INDEX IF NOT EXISTS idx_applications_audition ON public.applications(audition_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.applications(applicant_id);