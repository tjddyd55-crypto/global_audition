-- GLOBAL AUDITION 캐스팅 제안 · 인재 검색 · 안전장치 · 앱 내 알림.
-- 계약·결제·크레딧과 연결하지 않는다(수락 = 관심 표시일 뿐).

-- 기획사 저장 인재(기획사 계정 단위). memo 는 그 기획사 내부용이며 번역·공개 API로 내보내지 않는다.
CREATE TABLE IF NOT EXISTS agency_saved_talents (
    id UUID PRIMARY KEY,
    agency_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    talent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_name TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_agency_saved_talent UNIQUE (agency_user_id, talent_user_id)
);
CREATE INDEX IF NOT EXISTS idx_agency_saved_talents_agency ON agency_saved_talents(agency_user_id, group_name);

CREATE TABLE IF NOT EXISTS casting_offers (
    id UUID PRIMARY KEY,
    agency_user_id UUID NOT NULL REFERENCES users(id),
    agency_branch_id UUID,
    talent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    role_field TEXT NOT NULL,
    message TEXT NOT NULL,
    work_country TEXT,
    work_location TEXT,
    schedule_text TEXT,
    compensation_type TEXT NOT NULL,
    compensation_note TEXT,
    audition_id UUID,
    contact_requested BOOLEAN NOT NULL DEFAULT FALSE,
    contact_shared BOOLEAN NOT NULL DEFAULT FALSE,
    text_source_locale TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    deadline_notified_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_reason TEXT,
    response_note TEXT,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_casting_offer_status CHECK (status IN ('SENT', 'READ', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN')),
    CONSTRAINT chk_casting_offer_comp CHECK (compensation_type IN ('PAID', 'UNPAID', 'NEGOTIABLE', 'TBD'))
);
CREATE INDEX IF NOT EXISTS idx_casting_offers_talent ON casting_offers(talent_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casting_offers_agency ON casting_offers(agency_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_casting_offers_open_expiry ON casting_offers(expires_at) WHERE status IN ('SENT', 'READ');
CREATE INDEX IF NOT EXISTS idx_casting_offers_pair ON casting_offers(agency_user_id, talent_user_id, created_at DESC);

-- 상태 이력(서버 전이만 기록).
CREATE TABLE IF NOT EXISTS casting_offer_events (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES casting_offers(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_user_id UUID,
    actor_kind TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_casting_offer_events_offer ON casting_offer_events(offer_id, created_at);

-- 지원자가 차단한 기획사: 검색 결과에서 빠지고 새 제안을 보낼 수 없다.
CREATE TABLE IF NOT EXISTS casting_agency_blocks (
    id UUID PRIMARY KEY,
    talent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_casting_agency_block UNIQUE (talent_user_id, agency_user_id)
);

CREATE TABLE IF NOT EXISTS casting_reports (
    id UUID PRIMARY KEY,
    offer_id UUID REFERENCES casting_offers(id) ON DELETE SET NULL,
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    detail TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    resolution_note TEXT,
    handled_by UUID,
    handled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_casting_report_reason CHECK (reason IN ('SPAM', 'FRAUD', 'EXTERNAL_PAYMENT', 'HARASSMENT', 'INAPPROPRIATE', 'OTHER')),
    CONSTRAINT chk_casting_report_status CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED'))
);
CREATE INDEX IF NOT EXISTS idx_casting_reports_status ON casting_reports(status, created_at DESC);

-- 기획사별 운영 제어(슈퍼관리자). plan_code 는 향후 유료 플랜 확장 자리(현재 과금 없음).
CREATE TABLE IF NOT EXISTS agency_casting_controls (
    agency_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    offers_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    restricted_reason TEXT,
    daily_limit INTEGER,
    plan_code TEXT NOT NULL DEFAULT 'FREE',
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 앱 내 알림(오디션 회차 알림 외). 푸시는 없다.
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    link TEXT,
    dedupe_key TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_notifications_dedupe ON user_notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
