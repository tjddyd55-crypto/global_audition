SET search_path TO public;

-- 조회수 중복 방지: 로그인 user_id 또는 비로그인 ip_hash 단위로 쿨다운 윈도우 내 1회만 카운트
CREATE TABLE IF NOT EXISTS public.channel_video_view_dedup (
  id UUID PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.channel_videos (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users (id) ON DELETE CASCADE,
  ip_hash VARCHAR(64),
  last_counted_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT chk_cv_view_dedup_fingerprint CHECK (
    (user_id IS NOT NULL AND ip_hash IS NULL)
    OR (user_id IS NULL AND ip_hash IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cv_view_dedup_video_user
  ON public.channel_video_view_dedup (video_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cv_view_dedup_video_ip
  ON public.channel_video_view_dedup (video_id, ip_hash)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_cv_view_dedup_video ON public.channel_video_view_dedup (video_id);
