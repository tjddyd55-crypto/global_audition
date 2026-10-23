-- 공통 콘텐츠 번역. V39–V46 과 audition_translations 는 수정하지 않는다.
-- audition_translations.locale 는 VARCHAR(8) 그대로다. ko/en/mn 과 언어 서브태그(zh)만 그 열에 둔다.
-- zh-Hant, pt-BR, zh-Hant-TW 처럼 스크립트·지역을 보존하는 BCP 47 태그는 아래 VARCHAR(35) 에만 저장한다.
-- 기존 auditions.default_locale 값은 다시 쓰지 않는다. 한국어 원문을 영어로 바꾸지 않는다.

CREATE TABLE IF NOT EXISTS public.content_translations (
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    locale VARCHAR(35) NOT NULL,
    source_locale VARCHAR(35),
    source_hash VARCHAR(64),
    source_revision BIGINT,
    body JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL,
    stale BOOLEAN NOT NULL DEFAULT FALSE,
    provider TEXT,
    origin TEXT NOT NULL DEFAULT 'AUTO',
    manually_edited BOOLEAN NOT NULL DEFAULT FALSE,
    row_version BIGINT NOT NULL DEFAULT 0,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (content_type, content_id, locale),
    CONSTRAINT content_translations_status_chk CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    CONSTRAINT content_translations_origin_chk CHECK (origin IN ('MANUAL', 'AUTO'))
);

COMMENT ON TABLE public.content_translations IS
    'Stored translation document. Original text stays on the source table. Lookup never calls a provider.';
COMMENT ON COLUMN public.content_translations.locale IS
    'Canonical BCP 47 target locale, up to 35 chars. Not the VARCHAR(8) audition_translations.locale column.';
COMMENT ON COLUMN public.content_translations.source_locale IS
    'Authoring locale when known. Null means unknown. Do not infer ko or en.';

CREATE TABLE IF NOT EXISTS public.content_translation_attempts (
    id UUID NOT NULL PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    locale VARCHAR(35) NOT NULL,
    job_id UUID,
    requested_by UUID,
    agency_id UUID,
    status TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    provider TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost_micro_usd BIGINT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT content_translation_attempts_status_chk
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'BLOCKED'))
);

COMMENT ON COLUMN public.content_translation_attempts.estimated_cost_micro_usd IS
    'Estimate from configured per-million prices. Null when the provider was not called. Not an invoice.';

CREATE INDEX IF NOT EXISTS idx_content_translation_attempts_lookup
    ON public.content_translation_attempts (content_type, content_id, locale, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_translation_attempts_cost_user
    ON public.content_translation_attempts (requested_by, started_at);

CREATE INDEX IF NOT EXISTS idx_content_translation_attempts_cost_agency
    ON public.content_translation_attempts (agency_id, started_at);

CREATE TABLE IF NOT EXISTS public.content_translation_jobs (
    id UUID NOT NULL PRIMARY KEY,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    locale VARCHAR(35) NOT NULL,
    source_hash VARCHAR(64),
    requested_by UUID,
    agency_id UUID,
    status TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    force BOOLEAN NOT NULL DEFAULT FALSE,
    lease_owner TEXT,
    lease_until TIMESTAMPTZ,
    run_after TIMESTAMPTZ,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT content_translation_jobs_status_chk
        CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED'))
);

COMMENT ON TABLE public.content_translation_jobs IS
    'Durable queue. Workers claim with FOR UPDATE SKIP LOCKED and a lease so a restart can recover RUNNING rows.';

CREATE UNIQUE INDEX IF NOT EXISTS ux_content_translation_jobs_active
    ON public.content_translation_jobs (content_type, content_id, locale)
    WHERE status IN ('PENDING', 'RUNNING');

CREATE INDEX IF NOT EXISTS idx_content_translation_jobs_claim
    ON public.content_translation_jobs (created_at)
    WHERE status IN ('PENDING', 'RUNNING');

CREATE INDEX IF NOT EXISTS idx_content_translation_jobs_requester
    ON public.content_translation_jobs (requested_by, created_at);

CREATE INDEX IF NOT EXISTS idx_content_translation_jobs_agency
    ON public.content_translation_jobs (agency_id, created_at);

-- 원문 언어를 알 때만 채운다. 기본값 없음. 기존 행은 NULL(미상)로 남긴다.
ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS intro_source_locale VARCHAR(35);

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS text_source_locale VARCHAR(35);

ALTER TABLE public.channels
    ADD COLUMN IF NOT EXISTS description_source_locale VARCHAR(35);

ALTER TABLE public.channel_videos
    ADD COLUMN IF NOT EXISTS text_source_locale VARCHAR(35);

ALTER TABLE public.application_videos
    ADD COLUMN IF NOT EXISTS text_source_locale VARCHAR(35);

ALTER TABLE public.audition_rounds
    ADD COLUMN IF NOT EXISTS notice_source_locale VARCHAR(35);

COMMENT ON COLUMN public.applications.intro_source_locale IS
    'Explicit authoring locale for applications.intro_text. Null if unknown. Never backfilled to en or ko.';
