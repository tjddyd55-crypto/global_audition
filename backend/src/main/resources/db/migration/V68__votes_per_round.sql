-- 회차별 투표: 사용자 1명은 (오디션, 회차)마다 1표.
-- 회차 번호 = MULTI_ROUND 는 auditions.current_round_number, 그 외(단일·시리즈)는 auditions.series_round.
-- 기존 투표는 지우지 않는다. 투표 당시 회차를 아래 순서로 정해 round_number 에 채운다.
--   1) round_id 가 있으면 그 라운드 번호(정확).
--   2) MULTI_ROUND 가 아니면 공고의 series_round(시리즈 공고는 회차마다 별도 공고라 정확).
--   3) MULTI_ROUND: 현재 회차가 1 이하면 1(정확). 그 외에는 투표 시각 이전에 시작한(start_at) 가장 늦은 회차,
--      현재 회차를 넘지 않게 자르고, 시작 시각 정보가 없으면 1차로 본다(기존에는 오디션당 1표였으므로 최초 회차가 기본).
--   4) 위 매핑으로 같은 (사용자, 오디션, 회차)에 2표 이상이 생기면 가장 이른 표만 그 회차에 남기고 나머지는
--      round_number = NULL(미배정)로 둔다. 행은 보존하지만 회차 집계·중복 제한에는 들어가지 않는다.

ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS round_number INT NULL;

UPDATE public.votes v
SET round_number = r.round_number
FROM public.audition_rounds r
WHERE v.round_id = r.id
  AND v.round_number IS NULL;

UPDATE public.votes v
SET round_number = GREATEST(COALESCE(a.series_round, 1), 1)
FROM public.auditions a
WHERE v.audition_id = a.id
  AND v.round_number IS NULL
  AND COALESCE(a.process_mode, 'SINGLE') <> 'MULTI_ROUND';

UPDATE public.votes v
SET round_number = CASE
    WHEN COALESCE(a.current_round_number, 1) <= 1 THEN 1
    ELSE LEAST(
        COALESCE(
            (SELECT MAX(r.round_number)
               FROM public.audition_rounds r
              WHERE r.audition_id = v.audition_id
                AND r.start_at IS NOT NULL
                AND r.start_at <= v.created_at),
            1),
        a.current_round_number)
  END
FROM public.auditions a
WHERE v.audition_id = a.id
  AND v.round_number IS NULL;

-- 공고 행이 없는 고아 투표(이론상 없음)는 1차로.
UPDATE public.votes SET round_number = 1 WHERE round_number IS NULL AND round_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.auditions a WHERE a.id = votes.audition_id);

WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, audition_id, round_number ORDER BY created_at, id) AS rn
      FROM public.votes
     WHERE round_number IS NOT NULL
)
UPDATE public.votes v
SET round_number = NULL
FROM ranked
WHERE ranked.id = v.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_user_audition_round
  ON public.votes (user_id, audition_id, round_number)
  WHERE round_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_votes_audition_round_app
  ON public.votes (audition_id, round_number, application_id);

-- 오디션당 1표(레거시)·round_id 당 1표 제한은 위 회차 단위 제한으로 대체한다.
DROP INDEX IF EXISTS public.uq_votes_user_audition_legacy;
DROP INDEX IF EXISTS public.uq_votes_user_round;

COMMENT ON COLUMN public.votes.round_number IS
  '투표 회차(MULTI_ROUND=current_round_number, 그 외=series_round). NULL=마이그레이션 중 중복으로 미배정된 보존 행(집계 제외).';
