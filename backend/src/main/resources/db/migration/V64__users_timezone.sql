-- 지원자 계정의 IANA 시간대. UI 언어와 별개이며 기존 행은 비워 둔다.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(64);

COMMENT ON COLUMN public.users.timezone IS
    'IANA time zone id such as Asia/Seoul. Nullable. Does not select the UI language.';
