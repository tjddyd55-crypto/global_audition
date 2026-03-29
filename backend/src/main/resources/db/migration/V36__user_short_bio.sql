ALTER TABLE users
    ADD COLUMN IF NOT EXISTS short_bio VARCHAR(30);

COMMENT ON COLUMN users.short_bio IS '채널 헤더 한줄 소개(최대 30자, 줄바꿈 없음)';
