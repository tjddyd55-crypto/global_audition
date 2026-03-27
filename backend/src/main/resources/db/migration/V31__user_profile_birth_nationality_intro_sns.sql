SET search_path TO public;

ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS intro_text TEXT;

UPDATE users SET intro_text = bio WHERE intro_text IS NULL AND bio IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_sns_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sns_links_user_id ON user_sns_links(user_id);
