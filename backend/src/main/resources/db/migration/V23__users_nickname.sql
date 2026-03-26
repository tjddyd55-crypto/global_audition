-- 닉네임(화면 표시) / name(실명·내부). display_name 은 nickname || name || email 로 동기화(기존 API 호환).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);

UPDATE public.users
SET nickname = LEFT(TRIM(email), 50)
WHERE nickname IS NULL OR TRIM(COALESCE(nickname, '')) = '';

UPDATE public.users
SET display_name = CASE
    WHEN nickname IS NOT NULL AND TRIM(nickname) <> '' THEN TRIM(nickname)
    WHEN name IS NOT NULL AND TRIM(name) <> '' THEN TRIM(name)
    ELSE email
END;

ALTER TABLE public.users ALTER COLUMN nickname SET NOT NULL;
