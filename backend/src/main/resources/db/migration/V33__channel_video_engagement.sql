SET search_path TO public;

ALTER TABLE IF EXISTS public.channel_videos
  ADD COLUMN IF NOT EXISTS dislike_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.channel_subscriptions (
  id UUID PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  channel_owner_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_channel_subscriber_owner UNIQUE (subscriber_id, channel_owner_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_owner ON public.channel_subscriptions (channel_owner_id);

CREATE TABLE IF NOT EXISTS public.channel_video_comments (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.channel_videos (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_video_comments_video ON public.channel_video_comments (video_id);

CREATE TABLE IF NOT EXISTS public.channel_video_reactions (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.channel_videos (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_channel_video_reaction_user UNIQUE (video_id, user_id),
  CONSTRAINT channel_video_reactions_kind_chk CHECK (reaction IN ('LIKE', 'DISLIKE'))
);

CREATE INDEX IF NOT EXISTS idx_channel_video_reactions_video ON public.channel_video_reactions (video_id);
