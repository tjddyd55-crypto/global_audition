SET search_path TO public;

-- application_videos: 지원 영상 메타 (채널과 분리 저장, 조회/랭킹 시 우선 사용)
ALTER TABLE public.application_videos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE public.application_videos
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.application_videos
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.application_videos
  ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.application_videos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.application_videos SET updated_at = created_at WHERE updated_at IS NULL;

-- 오디션별 랭킹/추천 집계 캐시 (실시간 전 테이블 스캔 지양)
CREATE TABLE IF NOT EXISTS public.application_scores (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  vote_count BIGINT NOT NULL DEFAULT 0,
  total_view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  weighted_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  recommended_rank INT,
  recommended BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_scores_audition ON public.application_scores(audition_id);
