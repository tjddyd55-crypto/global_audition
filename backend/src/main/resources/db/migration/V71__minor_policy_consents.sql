-- GLOBAL AUDITION 미성년자 이용 정책 · 가입 동의 기록 · 보호자 확인 · 선발 이후 동의 구조 · 성별.
-- 기존 회원에게 동의/보호자 기록을 만들지 않는다(이 마이그레이션은 행을 INSERT 하는 곳이 국가 정책 기본값뿐이다).

-- 국가별 미성년자·법정대리인 기준. 코드에 연령을 하드코딩하지 않고 이 표를 읽는다.
-- country_code = 'DEFAULT' 는 표에 없는 국가에 쓰는 기본값이다. 슈퍼관리자 화면에서 수정한다.
CREATE TABLE IF NOT EXISTS country_minor_policies (
    country_code TEXT PRIMARY KEY,
    adult_age INTEGER NOT NULL,
    guardian_consent_under_age INTEGER NOT NULL,
    guardian_required_for_apply BOOLEAN NOT NULL DEFAULT TRUE,
    minor_offers_require_guardian BOOLEAN NOT NULL DEFAULT TRUE,
    minor_contact_sharing_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_minor_policy_ages CHECK (adult_age BETWEEN 10 AND 30
        AND guardian_consent_under_age BETWEEN 0 AND 30
        AND guardian_consent_under_age <= adult_age)
);

-- Development 기본값(운영 정책 확정 전). 법률 검토 후 슈퍼관리자 화면에서 바꾼다.
INSERT INTO country_minor_policies (country_code, adult_age, guardian_consent_under_age, note) VALUES
    ('DEFAULT', 18, 18, 'Dev 기본값: 정책 미확정 국가는 18세 미만 전원 보호자 확인'),
    ('KR', 19, 14, 'Dev 기본값: 민법 성년 19세, 개인정보 법정대리인 동의 14세 미만'),
    ('MN', 18, 18, 'Dev 기본값'),
    ('KH', 18, 18, 'Dev 기본값'),
    ('UZ', 18, 18, 'Dev 기본값'),
    ('JP', 18, 18, 'Dev 기본값'),
    ('US', 18, 13, 'Dev 기본값: COPPA 13세 미만')
ON CONFLICT (country_code) DO NOTHING;

-- 보호자 확인 요청. 미성년자가 공유 링크를 보호자에게 전달하고, 보호자가 별도 페이지에서 확인한다.
-- 토큰 원문은 저장하지 않는다(SHA-256 해시만).
CREATE TABLE IF NOT EXISTS guardian_confirmations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guardian_name TEXT,
    guardian_relationship TEXT,
    guardian_email TEXT,
    token_hash TEXT NOT NULL UNIQUE,
    method TEXT NOT NULL DEFAULT 'SHARE_LINK',
    status TEXT NOT NULL DEFAULT 'PENDING',
    terms_version TEXT NOT NULL,
    policy_country TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    confirmed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by TEXT,
    confirm_ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_guardian_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REVOKED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT chk_guardian_method CHECK (method IN ('SHARE_LINK'))
);
CREATE INDEX IF NOT EXISTS idx_guardian_confirmations_user ON guardian_confirmations(user_id, created_at DESC);

-- 회원 동의 기록(항목별 분리). 철회는 같은 행에 상태·시각을 남긴다.
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    status TEXT NOT NULL,
    agreed_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    source TEXT NOT NULL,
    guardian_confirmation_id UUID REFERENCES guardian_confirmations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_user_consent_type CHECK (consent_type IN
        ('TERMS_OF_SERVICE', 'PRIVACY_COLLECTION', 'PRIVACY_DISCLOSURE', 'GUARDIAN_CONSENT', 'MARKETING')),
    CONSTRAINT chk_user_consent_status CHECK (status IN ('AGREED', 'WITHDRAWN')),
    CONSTRAINT chk_user_consent_source CHECK (source IN ('SIGNUP', 'SETTINGS', 'GUARDIAN_LINK', 'ADMIN'))
);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id, consent_type, created_at DESC);

-- 실제 선발 이후 활동별 별도 동의 요건(구조만). 계약서 양식은 만들지 않는다.
CREATE TABLE IF NOT EXISTS post_selection_consent_requirements (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    casting_offer_id UUID REFERENCES casting_offers(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    guardian_required BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'REQUIRED',
    note TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_post_selection_activity CHECK (activity_type IN (
        'FINAL_CONTRACT', 'EXCLUSIVE_CONTRACT', 'TRAINEE_CONTRACT', 'IN_PERSON_AUDITION', 'OVERSEAS_TRAVEL',
        'TRAVEL_LODGING', 'FILMING_PERFORMANCE', 'PORTRAIT_CONTENT_RIGHTS', 'OTHER_GUARDIAN_REQUIRED')),
    CONSTRAINT chk_post_selection_status CHECK (status IN ('REQUIRED', 'IN_PROGRESS', 'SATISFIED', 'NOT_REQUIRED', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_post_selection_user ON post_selection_consent_requirements(user_id, created_at DESC);

-- 성별(선택 입력). 공개 여부는 channel_shown_fields 의 GENDER 키로 관리한다.
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_gender;
ALTER TABLE users ADD CONSTRAINT chk_users_gender
    CHECK (gender IS NULL OR gender IN ('FEMALE', 'MALE', 'NON_BINARY', 'UNDISCLOSED'));
