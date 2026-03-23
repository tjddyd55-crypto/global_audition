SET search_path TO public;

-- V1 에 UNIQUE 가 있으나, 일부 환경/이관에서 누락될 수 있어 idempotent 로 재보강.
-- 동시 지원 레이스 시 INSERT 실패 → 상위 트랜잭션 롤백으로 크레딧 차감도 함께 되돌림.
CREATE UNIQUE INDEX IF NOT EXISTS uq_applications_audition_applicant
  ON public.applications (audition_id, applicant_id);
