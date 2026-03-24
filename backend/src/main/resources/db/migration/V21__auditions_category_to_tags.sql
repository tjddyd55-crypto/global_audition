-- 오디션 공고: 단일 category → 검색·필터용 tags(text[])
ALTER TABLE auditions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

UPDATE auditions
SET tags = CASE
  WHEN category IS NOT NULL AND btrim(category) <> '' THEN ARRAY[btrim(category)]::text[]
  ELSE '{}'::text[]
END
WHERE true;

ALTER TABLE auditions DROP COLUMN IF EXISTS category;
