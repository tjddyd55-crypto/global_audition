-- 프로필 경력·활동 분야는 users 가 단일 원본이다.
-- channel_shown_fields 가 NULL 이면 기존 공개 채널 응답을 유지한다.
-- 빈 배열은 프로필 항목을 공개하지 않도록 저장한 값이다. 경력·활동은 키가 있을 때만 공개된다.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS career_text TEXT,
    ADD COLUMN IF NOT EXISTS activity_fields TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS channel_shown_fields TEXT[];

COMMENT ON COLUMN public.users.career_text IS
    'Profile career text. The channel publishes it only when CAREER is selected.';

COMMENT ON COLUMN public.users.activity_fields IS
    'Profile activity fields. Specialties stay in channel_categories.';

COMMENT ON COLUMN public.users.channel_shown_fields IS
    'Allow-list of profile keys on the public channel read model. NULL keeps the previous public profile fields.';
