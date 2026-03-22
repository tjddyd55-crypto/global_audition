SET search_path TO public;

-- 대량 크레딧 지급 필터용 (선택). 없으면 country 조건 미사용.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country_code TEXT;

CREATE INDEX IF NOT EXISTS idx_users_country_created ON public.users (country_code, created_at);

COMMENT ON COLUMN public.users.country_code IS 'ISO 국가 코드 등 (대량 지급 조건용, 선택)';
