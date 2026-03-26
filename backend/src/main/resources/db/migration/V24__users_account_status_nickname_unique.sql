-- 계정 상태(관리자 목록 등). 기존 유저는 ACTIVE.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED'));

-- 대소문자 무시 중복 닉네임 백필: 가장 오래된 1명만 유지, 나머지는 짧은 id 접미사
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY LOWER(TRIM(nickname))
               ORDER BY created_at ASC NULLS LAST, id
           ) AS rn
    FROM public.users
)
UPDATE public.users u
SET nickname = LEFT(
        TRIM(u.nickname) || '_' || REPLACE(SUBSTRING(u.id::text, 1, 8), '-', ''),
        50
    )
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

-- 공개 표시명: 닉네임 → 이메일 로컬파트(비상 폴백). 실명은 공개 라벨에서 제외.
UPDATE public.users
SET display_name = CASE
    WHEN nickname IS NOT NULL AND TRIM(nickname) <> '' THEN TRIM(nickname)
    WHEN TRIM(split_part(email, '@', 1)) <> '' THEN TRIM(split_part(email, '@', 1))
    ELSE '사용자'
END;

DROP INDEX IF EXISTS uq_users_nickname_lower;
CREATE UNIQUE INDEX uq_users_nickname_lower ON public.users (LOWER(TRIM(nickname)));
