-- Google Cloud Translation is the default active provider.
-- The V44 provider column and OpenAI ciphertext stay as stored. This migration does not UPDATE them.
-- V47 content tables are not rewritten. billed_characters is additive and nullable.

ALTER TABLE public.platform_translation_settings
    ADD COLUMN IF NOT EXISTS active_provider TEXT NOT NULL DEFAULT 'GOOGLE_CLOUD_TRANSLATION',
    ADD COLUMN IF NOT EXISTS google_project_id TEXT,
    ADD COLUMN IF NOT EXISTS google_location TEXT,
    ADD COLUMN IF NOT EXISTS google_model TEXT,
    ADD COLUMN IF NOT EXISTS google_credentials_cipher TEXT,
    ADD COLUMN IF NOT EXISTS google_cost_micro_usd_per_million BIGINT;

ALTER TABLE public.platform_translation_settings
    DROP CONSTRAINT IF EXISTS platform_translation_settings_active_provider_chk;

ALTER TABLE public.platform_translation_settings
    ADD CONSTRAINT platform_translation_settings_active_provider_chk
        CHECK (active_provider IN ('GOOGLE_CLOUD_TRANSLATION', 'OPENAI_COMPATIBLE'));

COMMENT ON COLUMN public.platform_translation_settings.active_provider IS
    'Provider used for new calls. Default GOOGLE_CLOUD_TRANSLATION. OpenAI endpoint, model, and api_key_cipher are kept.';
COMMENT ON COLUMN public.platform_translation_settings.google_credentials_cipher IS
    'AES-GCM ciphertext of a Google service-account JSON. Never returned to clients or written to logs.';
COMMENT ON COLUMN public.platform_translation_settings.google_cost_micro_usd_per_million IS
    'Optional character-price override for estimates, in micro-USD per million source characters. Null uses app.translation.google.micro-usd-per-million-characters. Not an invoice.';

ALTER TABLE public.content_translation_attempts
    ADD COLUMN IF NOT EXISTS billed_characters INTEGER;

COMMENT ON COLUMN public.content_translation_attempts.billed_characters IS
    'Source characters submitted to a character-billed provider. Null when that provider was not called. Not an invoice.';

CREATE INDEX IF NOT EXISTS idx_content_translation_attempts_started
    ON public.content_translation_attempts (started_at);
