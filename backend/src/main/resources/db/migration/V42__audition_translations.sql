-- 오디션 UGC 로케일 모델 (SSOT: docs/_ssot/03_I18N_TRANSLATION.md).
-- auditions.* 는 originalLocale(default_locale) 원문.
-- 번역 행이 없으면 원문 fallback. 자동 번역 Provider 는 다음 단계.

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS default_locale VARCHAR(8) NOT NULL DEFAULT 'ko';

COMMENT ON COLUMN public.auditions.default_locale IS
    'Original content locale (BCP-47 short: ko/en/mn/…). Base title/description stay here.';

CREATE TABLE IF NOT EXISTS public.audition_translations (
    audition_id UUID NOT NULL REFERENCES public.auditions (id) ON DELETE CASCADE,
    locale VARCHAR(8) NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    agency_name TEXT NOT NULL DEFAULT '',
    recruit_fields TEXT[] NOT NULL DEFAULT '{}',
    qualifications TEXT[] NOT NULL DEFAULT '{}',
    schedules TEXT[] NOT NULL DEFAULT '{}',
    benefits TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'COMPLETED'
        CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    provider TEXT NOT NULL DEFAULT 'MANUAL',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (audition_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_audition_translations_locale
    ON public.audition_translations (locale);

COMMENT ON TABLE public.audition_translations IS
    'Completed locale overlay for public audition fields. Fallback is auditions.* at default_locale.';
