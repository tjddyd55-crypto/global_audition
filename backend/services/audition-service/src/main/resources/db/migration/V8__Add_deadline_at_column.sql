-- V8: Add deadline_at column if not exists
-- deadline_at 컬럼이 없으면 추가 (V6 마이그레이션이 제대로 적용되지 않은 경우 대비)

ALTER TABLE auditions 
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;

-- 인덱스 생성 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS idx_auditions_deadline_at ON auditions(deadline_at);
