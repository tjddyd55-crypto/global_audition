-- V3: Add video_type and visibility to video_contents (Personal Channel)
-- 작업: 2026_12_personal_channel_media

ALTER TABLE video_contents ADD COLUMN IF NOT EXISTS video_type VARCHAR(20) DEFAULT 'ORIGINAL';
ALTER TABLE video_contents ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'PUBLIC';

-- video_type: ORIGINAL(자작곡), COMPOSITION(작곡곡), COVER(커버곡)
-- visibility: PUBLIC(공개), PRIVATE(비공개), FOLLOWERS_ONLY(팔로워만)

CREATE INDEX IF NOT EXISTS idx_video_contents_video_type ON video_contents(video_type);
CREATE INDEX IF NOT EXISTS idx_video_contents_visibility ON video_contents(visibility);
