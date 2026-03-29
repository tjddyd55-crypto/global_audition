-- 채널 프로필: 분야(최대 3)·대표 영상(소유 영상 1개)
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_categories TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS featured_video_id UUID NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS fk_users_featured_video;
ALTER TABLE users
  ADD CONSTRAINT fk_users_featured_video
  FOREIGN KEY (featured_video_id) REFERENCES channel_videos(id) ON DELETE SET NULL;
