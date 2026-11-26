CREATE TABLE point_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    earning_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    spending_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    audition_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    audition_cost BIGINT NOT NULL CHECK (audition_cost BETWEEN 1 AND 1000000000)
);
INSERT INTO point_settings(singleton, audition_cost) VALUES(TRUE, 3000);

CREATE TABLE point_wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    country_code VARCHAR(2),
    balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

CREATE TABLE point_policies (
    id UUID PRIMARY KEY,
    activity TEXT NOT NULL CHECK (activity IN ('DAILY_CHECK_IN','MONTHLY_CHECK_IN','LIKE_RECEIVED','LIKE_GIVEN','COMMENT','REFERRAL','VIDEO','PUBLIC_VOTE','PROFILE')),
    country_code VARCHAR(2) NOT NULL DEFAULT '',
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    goal INTEGER NOT NULL CHECK (goal > 0),
    award BIGINT NOT NULL CHECK (award BETWEEN 1 AND 1000000000),
    repeatable BOOLEAN NOT NULL DEFAULT FALSE,
    daily_limit INTEGER NOT NULL CHECK (daily_limit >= 0),
    monthly_limit INTEGER NOT NULL CHECK (monthly_limit >= 0),
    daily_event_limit INTEGER NOT NULL DEFAULT 0 CHECK (daily_event_limit >= 0),
    monthly_point_limit BIGINT NOT NULL DEFAULT 0 CHECK (monthly_point_limit >= 0),
    consecutive BOOLEAN NOT NULL DEFAULT FALSE,
    profile_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    min_account_days INTEGER NOT NULL DEFAULT 0 CHECK (min_account_days >= 0),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revision INTEGER NOT NULL DEFAULT 1,
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
    UNIQUE (activity, country_code)
);
INSERT INTO point_policies(id,activity,name,goal,award,repeatable,daily_limit,monthly_limit,daily_event_limit,profile_fields,min_account_days) VALUES
('00000000-0000-4000-a101-000000000001','DAILY_CHECK_IN','일일 출석',1,10,TRUE,1,31,1,'{}',0),
('00000000-0000-4000-a101-000000000002','MONTHLY_CHECK_IN','월간 출석',25,300,TRUE,1,1,0,'{}',0),
('00000000-0000-4000-a101-000000000003','LIKE_RECEIVED','영상 좋아요 달성',100,500,FALSE,1,1,0,'{}',0),
('00000000-0000-4000-a101-000000000004','COMMENT','유효 댓글 작성',10,50,TRUE,1,10,10,'{}',0),
('00000000-0000-4000-a101-000000000005','REFERRAL','친구 초대',1,200,TRUE,1,10,0,'{}',7),
('00000000-0000-4000-a101-000000000006','VIDEO','채널 영상 등록',1,50,TRUE,1,10,0,'{}',0),
('00000000-0000-4000-a101-000000000007','PUBLIC_VOTE','공개 투표 참여',1,10,TRUE,1,10,0,'{}',0),
('00000000-0000-4000-a101-000000000008','PROFILE','프로필 작성 완료',1,100,FALSE,1,1,0,ARRAY['nickname','birthDate','countryCode','introText'],0),
('00000000-0000-4000-a101-000000000009','LIKE_GIVEN','영상 좋아요 참여',1,10,TRUE,1,10,0,'{}',0);

CREATE TABLE point_policy_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    scope TEXT NOT NULL,
    actor_id UUID NOT NULL,
    before_config JSONB NOT NULL,
    after_config JSONB NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE point_activity_events (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    event_key TEXT NOT NULL,
    progress_scope TEXT NOT NULL DEFAULT '',
    source_user_id UUID,
    source_id UUID,
    event_day DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    policy_id UUID REFERENCES point_policies(id),
    policy_revision INTEGER,
    PRIMARY KEY (user_id,activity,event_key)
);
CREATE INDEX point_events_progress ON point_activity_events(user_id,policy_id,policy_revision,event_day);

-- Existing participation is remembered without earning under a future policy.
INSERT INTO point_activity_events(user_id,activity,event_key,event_day)
SELECT owner_id,'VIDEO',youtube_video_id,(created_at AT TIME ZONE 'UTC')::date
FROM channel_videos WHERE youtube_video_id IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO point_activity_events(user_id,activity,event_key,event_day)
SELECT user_id,'PUBLIC_VOTE',audition_id::text || ':' || round_number::text,(created_at AT TIME ZONE 'UTC')::date
FROM votes WHERE round_number IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE point_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount <> 0),
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    kind TEXT NOT NULL CHECK (kind IN ('EARN','AUDITION_APPLY','REFUND','ADMIN_GRANT','ADMIN_DEDUCT','REVOKE')),
    reason TEXT NOT NULL,
    activity TEXT,
    policy_id UUID REFERENCES point_policies(id),
    policy_revision INTEGER,
    actor_id UUID,
    reference_id UUID,
    event_day DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dedup_key TEXT NOT NULL,
    UNIQUE (user_id,dedup_key)
);
CREATE INDEX point_entries_user_history ON point_entries(user_id,created_at DESC,id DESC);
CREATE INDEX point_entries_policy_usage ON point_entries(user_id,policy_id,event_day) WHERE kind='EARN';
CREATE INDEX point_entries_audition_application ON point_entries(reference_id) WHERE kind='AUDITION_APPLY';

-- Future expiry rules can retain a snapshot without expiring existing balances.
CREATE TABLE point_expiry_policy (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    validity_days INTEGER CHECK (validity_days IS NULL OR validity_days > 0)
);

CREATE TABLE point_invite_codes (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    code UUID NOT NULL UNIQUE
);
CREATE TABLE point_referrals (
    invited_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CHECK (invited_user_id <> inviter_user_id)
);
