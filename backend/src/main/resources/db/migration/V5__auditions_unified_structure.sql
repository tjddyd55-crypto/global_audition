SET search_path TO public;

-- description NOT NULL (기존 null 보정)
UPDATE public.auditions SET description = '' WHERE description IS NULL;
ALTER TABLE public.auditions ALTER COLUMN description SET NOT NULL;

ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS gallery_images TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS agency_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS agency_logo TEXT;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS applicants_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS remaining_days INT NOT NULL DEFAULT 0;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS recruit_fields TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT '';
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS detail_content JSONB NOT NULL DEFAULT '{"recruit":[],"qualification":[],"schedule":[],"benefits":[]}'::jsonb;
ALTER TABLE public.auditions ADD COLUMN IF NOT EXISTS benefits TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.auditions SET start_date = created_at WHERE start_date IS NULL;
UPDATE public.auditions SET end_date = COALESCE(deadline_at, created_at + interval '30 days') WHERE end_date IS NULL;
