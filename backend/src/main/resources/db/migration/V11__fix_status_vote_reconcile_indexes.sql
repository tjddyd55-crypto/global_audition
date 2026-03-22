SET search_path TO public;

-- =============================================================================
-- applications.status 정규화 (마이그레이션 중단·레거시 값 복구)
-- =============================================================================
UPDATE public.applications
SET status = 'REVIEWING'
WHERE status IS NULL
   OR TRIM(status) = ''
   OR UPPER(TRIM(status)) NOT IN ('SUBMITTED', 'REVIEWING', 'ACCEPTED', 'REJECTED');

-- =============================================================================
-- votes 기준 vote_count 일괄 재동기화 (런타임 COUNT(*) 조회가 아닌 일회성 정합성)
-- =============================================================================
UPDATE public.applications SET vote_count = 0;

UPDATE public.applications a
SET vote_count = s.cnt
FROM (
  SELECT application_id, COUNT(*)::bigint AS cnt
  FROM public.votes
  GROUP BY application_id
) s
WHERE a.id = s.application_id;

-- =============================================================================
-- 조회 성능
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_applications_audition_status ON public.applications (audition_id, status);
