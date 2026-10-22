-- 번역 수명주기. V42 행은 유지하고 컬럼만 추가한다.
-- 원문 텍스트는 auditions.* 에 그대로 두고, 로케일 태그만 더 긴 작성 언어를 담을 수 있게 넓힌다.

ALTER TABLE public.auditions
    ALTER COLUMN default_locale TYPE VARCHAR(16);

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS content_revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE public.auditions
    ADD COLUMN IF NOT EXISTS content_source_hash VARCHAR(64);

COMMENT ON COLUMN public.auditions.default_locale IS
    'Authoring locale tag stored as written (2-16 chars). Not coerced to en. Viewing overlay still uses the 8 content locales.';
COMMENT ON COLUMN public.auditions.content_revision IS
    'Monotonic version of translatable source fields. Incremented only when content_source_hash changes.';
COMMENT ON COLUMN public.auditions.content_source_hash IS
    'SHA-256 hex of translatable source fields at the last authoring write. Null until that write.';

ALTER TABLE public.audition_translations
    ADD COLUMN IF NOT EXISTS error_code TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS source_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS source_revision BIGINT,
    ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS stale BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.audition_translations
    DROP CONSTRAINT IF EXISTS audition_translations_origin_chk;
ALTER TABLE public.audition_translations
    ADD CONSTRAINT audition_translations_origin_chk CHECK (origin IN ('MANUAL', 'AUTO'));

COMMENT ON COLUMN public.audition_translations.error_code IS
    'FAILED reason such as NOT_CONFIGURED or PROVIDER_ERROR. Null when not failed.';
COMMENT ON COLUMN public.audition_translations.error_message IS
    'Operator-facing failure detail. Must not contain provider secrets.';
COMMENT ON COLUMN public.audition_translations.source_hash IS
    'SHA-256 of the original fields at the time this translation was written.';
COMMENT ON COLUMN public.audition_translations.source_revision IS
    'auditions.content_revision copied when this translation was written.';
COMMENT ON COLUMN public.audition_translations.origin IS
    'MANUAL human text or AUTO provider text. Existing rows stay MANUAL.';
COMMENT ON COLUMN public.audition_translations.manually_edited IS
    'True after a human save. Auto-translate must not overwrite unless force=true.';
COMMENT ON COLUMN public.audition_translations.stale IS
    'Original changed after this row was written. The row is kept.';

CREATE TABLE IF NOT EXISTS public.platform_translation_settings (
    id SMALLINT NOT NULL PRIMARY KEY DEFAULT 1,
    provider TEXT NOT NULL DEFAULT 'OPENAI_COMPATIBLE',
    endpoint_url TEXT,
    model TEXT,
    api_key_cipher TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,
    CONSTRAINT platform_translation_settings_singleton CHECK (id = 1)
);

INSERT INTO public.platform_translation_settings (id, provider)
VALUES (1, 'OPENAI_COMPATIBLE')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.platform_translation_settings IS
    'Server-side translation provider config. API key is ciphertext only.';
COMMENT ON COLUMN public.platform_translation_settings.api_key_cipher IS
    'AES-GCM ciphertext from SettingsSecretCrypto. Never returned to clients.';
