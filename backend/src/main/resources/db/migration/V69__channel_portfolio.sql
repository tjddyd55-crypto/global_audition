-- 개인 채널 포트폴리오: 공개 프로필 항목·경력·YouTube 확인 상태.
-- 기존 회원 행은 기본값만 받는다(검색 노출·캐스팅 수신은 모두 꺼짐 = 본인이 켜야 함).

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS residence_country TEXT NULL,
    ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS talents TEXT NULL,
    ADD COLUMN IF NOT EXISTS talent_search_visible BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS casting_offers_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.residence_country IS '공개 거주 국가(국적 코드 집합). 공개 여부는 channel_shown_fields RESIDENCE.';
COMMENT ON COLUMN public.users.languages IS '사용 가능 언어(ISO 639-1). 공개 여부는 channel_shown_fields LANGUAGES.';
COMMENT ON COLUMN public.users.talent_search_visible IS '기획사 인재 검색 노출 동의. 채널 공개와 별개.';
COMMENT ON COLUMN public.users.casting_offers_enabled IS '캐스팅 제안 수신 허용. 채널 공개와 별개. 성인 확인된 회원만 켤 수 있다.';
COMMENT ON COLUMN public.users.last_active_at IS '채널·영상·경력 수정 시각(최근 활동 정렬).';

CREATE TABLE IF NOT EXISTS public.channel_careers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    organization TEXT NULL,
    period_start TEXT NULL,
    period_end TEXT NULL,
    description TEXT NULL,
    text_source_locale VARCHAR(35) NULL,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT channel_careers_category_chk CHECK (category IN (
        'PERFORMANCE', 'TRAINING', 'DANCE_VOCAL', 'ACTING_MODEL', 'CONTEST_AWARD', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_channel_careers_user ON public.channel_careers (user_id, sort_order, created_at);

-- YouTube 링크 확인 결과(oEmbed 1회 조회 후 저장). 재생은 YouTube embed 만 사용한다.
ALTER TABLE public.channel_videos
    ADD COLUMN IF NOT EXISTS youtube_video_id TEXT NULL,
    ADD COLUMN IF NOT EXISTS embed_status TEXT NULL,
    ADD COLUMN IF NOT EXISTS embed_checked_at TIMESTAMPTZ NULL;

UPDATE public.channel_videos
SET youtube_video_id = substring(video_url FROM '(?:[?&]v=|youtu\.be/|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})')
WHERE youtube_video_id IS NULL;

COMMENT ON COLUMN public.channel_videos.embed_status IS
    'OK | NOT_FOUND | RESTRICTED | UNKNOWN (oEmbed 확인 결과). NULL = 아직 확인 안 함.';

CREATE INDEX IF NOT EXISTS idx_channel_videos_owner_public ON public.channel_videos (owner_id, visibility, created_at DESC);

-- 운영자 조치(문제 채널·영상 숨김). 데이터는 지우지 않고 공개 목록·상세에서만 뺀다.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS channel_moderation_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.channel_videos
    ADD COLUMN IF NOT EXISTS moderation_hidden BOOLEAN NOT NULL DEFAULT FALSE;
