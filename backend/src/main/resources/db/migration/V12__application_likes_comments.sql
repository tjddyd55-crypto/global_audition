SET search_path TO public;

CREATE TABLE IF NOT EXISTS public.application_likes (
  id UUID NOT NULL PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uk_application_likes_app_user UNIQUE (application_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.application_comments (
  id UUID NOT NULL PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_likes_app ON public.application_likes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_comments_app ON public.application_comments(application_id);
