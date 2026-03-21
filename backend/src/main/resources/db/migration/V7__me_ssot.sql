SET search_path TO public;

-- ---------------------------------------------------------------------------
-- users: SSOT profile fields (기존 name 컬럼 유지)
-- ---------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

UPDATE users
SET username = split_part(lower(trim(email)), '@', 1) || '_' || substring(replace(id::text, '-', ''), 1, 8)
WHERE username IS NULL OR btrim(username) = '';

UPDATE users
SET display_name = COALESCE(
    NULLIF(btrim(COALESCE(display_name, '')), ''),
    NULLIF(btrim(COALESCE(name, '')), ''),
    username
)
WHERE display_name IS NULL OR btrim(COALESCE(display_name, '')) = '';

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username);

-- ---------------------------------------------------------------------------
-- application_videos.title
-- ---------------------------------------------------------------------------
ALTER TABLE application_videos ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE application_videos SET title = 'Audition Video' WHERE title IS NULL OR btrim(title) = '';
ALTER TABLE application_videos ALTER COLUMN title SET NOT NULL;

-- ---------------------------------------------------------------------------
-- channels (1 owner : 1 channel MVP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT,
  profile_image_url TEXT,
  banner_image_url TEXT,
  subscriber_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channels_owner_id ON channels (owner_id);

-- ---------------------------------------------------------------------------
-- channel_videos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channel_videos (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL,
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT channel_videos_visibility_chk CHECK (visibility IN ('PUBLIC', 'PRIVATE'))
);

CREATE INDEX IF NOT EXISTS idx_channel_videos_channel_id ON channel_videos (channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_videos_owner_id ON channel_videos (owner_id);

-- ---------------------------------------------------------------------------
-- vault_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  visibility TEXT NOT NULL,
  creation_method TEXT NOT NULL DEFAULT 'HUMAN',
  file_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_items_owner_id ON vault_items (owner_id);
