SET search_path TO public;

-- =============================================================================
-- 투표( votes )와 지원 심사 상태( applications.status )는 스키마·도메인상 완전 분리.
-- 투표 수 조회 성능: applications.vote_count (실시간 COUNT(*) 지양).
-- =============================================================================

-- 지원 카드별 누적 투표 수 (읽기 경로는 이 컬럼만 사용)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS vote_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_votes_user_audition UNIQUE (user_id, audition_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_audition ON public.votes(audition_id);
CREATE INDEX IF NOT EXISTS idx_votes_application ON public.votes(application_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON public.votes(user_id);

-- V8 테이블에서 이관 (없으면 스킵)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audition_application_votes'
  ) THEN
    INSERT INTO public.votes (id, user_id, application_id, audition_id, created_at)
    SELECT id, voter_id, application_id, audition_id, created_at
    FROM public.audition_application_votes;
  END IF;
END $$;

DROP TABLE IF EXISTS public.audition_application_votes;

-- 카운터를 votes 기준으로 재계산 (이후 앱에서 트랜잭션으로 유지)
UPDATE public.applications SET vote_count = 0;

UPDATE public.applications a
SET vote_count = s.cnt
FROM (
  SELECT application_id, COUNT(*)::bigint AS cnt
  FROM public.votes
  GROUP BY application_id
) s
WHERE a.id = s.application_id;

-- applications.status: API/기획 ENUM SUBMITTED | REVIEWING | ACCEPTED | REJECTED (DB도 REVIEWING으로 통일)
UPDATE public.applications SET status = 'REVIEWING' WHERE status = 'REVIEWED';

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname AS name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'applications'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.applications DROP CONSTRAINT %I', r.name);
  END LOOP;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_chk
  CHECK (status IN ('SUBMITTED','REVIEWING','ACCEPTED','REJECTED'));
