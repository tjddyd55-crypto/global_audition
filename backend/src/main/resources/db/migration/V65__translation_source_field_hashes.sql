-- 번역 행이 만들어진 시점의 원문을 제목·설명·본문 해시로 따로 둔다.
-- 기존 source_hash 와 번역 본문은 바꾸지 않는다. 과거 행은 NULL 이라 source_hash 비교만 한다.
-- NULL 행을 다시 번역하거나 백필하지 않으므로 Google 번역을 새로 호출하지 않는다.

ALTER TABLE public.audition_translations
    ADD COLUMN IF NOT EXISTS source_field_hashes TEXT;

ALTER TABLE public.content_translations
    ADD COLUMN IF NOT EXISTS source_field_hashes TEXT;

COMMENT ON COLUMN public.audition_translations.source_field_hashes IS
    'JSON of SHA-256 hex for source title, description, and body at translation write. Null on rows written before V65.';
COMMENT ON COLUMN public.content_translations.source_field_hashes IS
    'JSON of SHA-256 hex for source title, description, and body at translation write. Null on rows written before V65.';
