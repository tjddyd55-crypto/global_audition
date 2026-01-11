-- V6: Add media and management fields to auditions table
-- 포스터, 영상, 차수 관리 필드 추가

ALTER TABLE auditions 
  ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS poster_key VARCHAR(500),
  ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) DEFAULT 'YOUTUBE',
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS video_key VARCHAR(500),
  ADD COLUMN IF NOT EXISTS max_rounds INTEGER DEFAULT 1 CHECK (max_rounds >= 1 AND max_rounds <= 3),
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;

-- 기존 banner_url 데이터를 poster_url로 마이그레이션 (하위 호환성)
UPDATE auditions 
SET poster_url = banner_url 
WHERE banner_url IS NOT NULL AND poster_url IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_auditions_poster_url ON auditions(poster_url);
CREATE INDEX IF NOT EXISTS idx_auditions_video_url ON auditions(video_url);
CREATE INDEX IF NOT EXISTS idx_auditions_deadline_at ON auditions(deadline_at);
CREATE INDEX IF NOT EXISTS idx_auditions_max_rounds ON auditions(max_rounds);
