-- 앱 내부 알림 수신 설정. 행이 없으면 모든 항목 수신(기본값 true).
CREATE TABLE IF NOT EXISTS user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    saved_deadline BOOLEAN NOT NULL DEFAULT TRUE,
    new_match BOOLEAN NOT NULL DEFAULT TRUE,
    results BOOLEAN NOT NULL DEFAULT TRUE,
    offers BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
