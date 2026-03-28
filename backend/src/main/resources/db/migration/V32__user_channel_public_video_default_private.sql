SET search_path TO public;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS is_channel_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS public.channel_videos
  ALTER COLUMN visibility SET DEFAULT 'PRIVATE';
