-- 수신함 읽음 시각. 발송 status(PENDING/SENT/FAILED)는 바꾸지 않는다.

ALTER TABLE public.audition_round_notifications
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.audition_round_notifications.read_at IS
    'When the account owner opened the in-app notice. Null means unread.';
