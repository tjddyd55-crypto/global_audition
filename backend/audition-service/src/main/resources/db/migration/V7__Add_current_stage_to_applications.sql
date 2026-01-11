-- V7: Add current_stage to applications table
-- 지원자의 현재 진행 단계 추적

ALTER TABLE applications 
  ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 0 NOT NULL CHECK (current_stage >= 0 AND current_stage <= 3);

-- 기존 데이터의 current_stage 계산 및 업데이트
-- finalResult가 PASS면 3, result3이 PASS면 3, result2가 PASS면 2, result1이 PASS면 1, 아니면 0
UPDATE applications 
SET current_stage = CASE
  WHEN final_result = 'PASS' THEN 3
  WHEN result3 = 'PASS' THEN 3
  WHEN result2 = 'PASS' THEN 2
  WHEN result1 = 'PASS' THEN 1
  ELSE 0
END
WHERE current_stage = 0;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_applications_current_stage ON applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_applications_audition_stage ON applications(audition_id, current_stage);
