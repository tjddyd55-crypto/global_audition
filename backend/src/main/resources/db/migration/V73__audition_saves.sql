-- 관심 오디션 저장. 지원(applications)과 별개다.
-- 공고가 마감돼도 기록을 남긴다. 삭제된 공고는 FK 없이 남겨 안내만 보여 준다.
CREATE TABLE IF NOT EXISTS audition_saves (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audition_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_audition_saves_user_audition UNIQUE (user_id, audition_id)
);
CREATE INDEX IF NOT EXISTS idx_audition_saves_user ON audition_saves(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audition_saves_audition ON audition_saves(audition_id);
